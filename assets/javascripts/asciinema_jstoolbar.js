(function() {
  
    // Compatibility checks
    if(!String.prototype.startsWith) {
        String.prototype.startsWith = function(searchString, position) {
            position = position || 0;
            return this.substr(position, searchString.length) === searchString;
        };
    }

    if(!String.prototype.endsWith) {
        String.prototype.endsWith = function(suffix) { 
            var l = this.length-suffix.length;
            
            return l >= 0 && this.lastIndexOf(suffix) === l;
        }
    }

    if (!String.prototype.trim) {
        String.prototype.trim = function () {
            return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
        };
    }
    
    /**
     * Adapter for operations with the Readmine default editor
     * @param editor Redmine editor instance
     */
    function getRedmineEditorAdapter(editor) {
        return {
            getText    : function() { return $(editor.textarea).val(); },
            getCaretPos: function() { return $(editor.textarea).prop("selectionStart"); },
            setCaret   : function() {},
            selectText : function(start, end) {
                editor.textarea.focus();
                
                if(typeof(editor.textarea.selectionStart) != 'undefined') {
                    // Firefox/Chrome
                    editor.textarea.selectionStart = start;
                    editor.textarea.selectionEnd   = end;
                }
                else {
                    // IE
                    var range = document.selection.createRange();
                    
                    range.collapse(true);
                    range.moveStart("character", start);
                    range.moveEnd("character", end);
                    range.select();
                }
            },
            replaceSelected: function(newText, insert) {
                if(insert)
                    editor.encloseSelection(newText);
                else
                    editor.encloseSelection(newText, '', function(sel) { return ''; });
            }
        }
    }
    
    /**
     * Adapter for operations with the TinyMCE editor
     * @param editor TinyMCE editor instance
     */
    function getTinymceEditorAdapter(editor) {
        var startSel=0, endSel;

        return {
            getText    : function() { return editor.selection.getRng().startContainer.textContent; },
            getCaretPos: function() { return editor.selection.getRng().startOffset; },
            setCaret   : function(start) { startSel = endSel = start; },
            selectText : function(start, end) {
                startSel = start;
                endSel = end;
            },
            replaceSelected: function(newText, insert) { 
                var text = editor.selection.getRng().startContainer.textContent;
                
                if(insert || !endSel)
                    endSel = startSel

                editor.selection.getRng().startContainer.nodeValue = text.substring(0, startSel)+newText+text.substring(endSel);
            }
        }
    }
  
    /**
     * Find where starts the expectedMacro and returs its parameters.<br/>
     * It expects that the cursor is positioned inside the macro.<br/>
     * The macro header (the opening brackets, the macro name and the
     * optional parameters) will be selected, so inserting the new
     * macro header will overwite the old.
     * @param editor The editor where to find the macro
     * @param expectedMacro The expected macro name
     * @return An hash with the macro arguments, or {@code null} if not found.
     */
    function findMacro(editorAdapter, expectedMacro) {
        var text = editorAdapter.getText();
        var caretPos = editorAdapter.getCaretPos();
        var initialCaretPos = caretPos;
      
        // Move left to find macro start; the test on } is needed for not go too much ahead
        while(caretPos > 0 && !text.startsWith('{{', caretPos) && !text.startsWith('}}', caretPos))
            caretPos--;
          
        if(text.startsWith('{{', caretPos)) {
            // Start of a macro
            var macro = text.substring(caretPos);
            var match = macro.match('^\\{\\{'+expectedMacro+'(?:\\((.*)\\))?(?:\\}\\})?');
              
            if(match) {
                // Select macro text
                editorAdapter.selectText(caretPos, caretPos+match[0].length);
                  
                // Extracting macro arguments
                var params = {};
                var args   = [];
                  
                if(match[1]) {
                    var positionalParams = 0;
                    
                    args = match[1].split(',');
                     
                    for(var i=0; i<args.length; i++) {
                        var parts = args[i].split('=');
                        
                        if(parts.length == 2) // Named parameter
                            params[parts[0].trim()] = parts[1].trim();
                        else // Positional parameter
                            params['_P'+(++positionalParams)] = parts[0].trim();
                    }
                }
                
                return params;
            }
        }
        
        editorAdapter.setCaret(initialCaretPos);
        return null;
    }
  
    /**
     * Show dialog for editing macro parameters.
     * @param editorAdapter Adapter for editor interaction
     * @param macroName Name of macro to edit/insert
     * @param fieldsPrefix Prefix for input fields in the form
     */
    function openMacroDialog(dlg, editorAdapter, macroName, fieldsPrefix) {
        var params = findMacro(editorAdapter, macroName);
      
        dlg.data('editor', editorAdapter)
           .data('macro', macroName)
           .data('prefix', fieldsPrefix)
           .data('params', params)
           .dialog('open');
    }
  
    /**
     * Add buttons to tinymce toolbar when editor is running.
     */
    function updateTinyMCEToolbar() {
        // See https://stackoverflow.com/questions/36411839/proper-way-of-modifying-toolbar-after-init-in-tinymce
        var editor = tinymce.activeEditor;
        
        if(editor) {
            editor.on('init', function() {
                var imgPath = Asciinema.settings.redmineUrl+'plugin_assets/redmine_asciinema/images';
                var bg = editor.theme.panel.find('toolbar buttongroup')[2];  // group with links/images/code/...
                
                editor.addButton('asciinema', {
                    title : Asciinema.strings['asciinema_title'],
                    image : imgPath+'/jstb_asciinema.png',
                    onclick: function() {
                        openMacroDialog(getTinymceEditorAdapter(editor), 'asciinema_cast');
                    }
                });
                bg.append(editor.buttons['asciinema']);
                
                if(Asciinema.settings.DMSF) {
                }
            });
        }
        else
            setTimeout(updateTinyMCEToolbar, 200);
    }
  
    // The dialogs for macro editing must be defined only when the document is ready
    var dlg, dlgXml;
  
    $(function() {
        function valid(values) {
            return ($("#asciinema_srctype").val() !== null && $("#asciinema_srctype").val() !== '') &&
                   (values['attachment'] !== null || values['dmsf'] !== null);
        }
        
        var dlgButtons = {};
        
        dlgButtons[Asciinema.strings['asciinema_btn_ok']] = function() {
            var editor    = dlg.data('editor');
            var macroName = dlg.data('macro');
            var prefix    = dlg.data('prefix');
            var options   = {};
            
            $("#dlg_redmine_asciinema :input").each(function(idx, val) {
                if($(this).attr('ignored')) {
                    var paramName = this.name.replace(new RegExp("^"+prefix+"_"), '');
            
                    switch($(this).attr('type')) {
                        case 'checkbox':
                            options[paramName] = $(this).prop('checked')? $(this).val(): null;
                            break;
                        case 'text':
                            options[paramName] = $(this).val();
                            break;
                        default: break;
                    }
                }
            });
    
            options['attachment'] = options['dmsf'] = null;
            options[$("input[name=asciinema_srctype]:checked").val()] = $("#asciinema_src").val();
    
            $.each(options, function(k, v) {
                if(v === null || v === '') {
                    delete options[k];
                }
            });
            
            if(valid(options)) {
                options = $.map(options, function(v, k) {
                    return k+"="+v;
                });
                
                if(options.length)
                    options = '('+options.join(',')+')';
                else
                    options = '';
                
                if(dlg.data('params')) 
                    // Edited macro: replace the old macro (with parameters) with the new text
                    editor.replaceSelected('{{'+macroName+options+'}}', false);
                else
                    // New macro
                    editor.replaceSelected('{{'+macroName+options+'}}', true);
                
                dlg.dialog('close');
            }
        };
        
        dlgButtons[Asciinema.strings['asciinema_btn_cancel']] = function() {
            dlg.dialog('close');
        };
        
        dlg = $('#dlg_redmine_asciinema').dialog({
            autoOpen: false,
            width   : "auto",
            height  : "auto",
            modal   : true,
            open    : function(event, ui) {
                var prefix = dlg.data('prefix');
                var params = dlg.data("params");
              
                if(params) {
                    for(key in params) {
                        var field = $("#"+prefix+"_"+key);
                        
                        if(field.attr('type') === 'checkbox')
                            field.prop('checked', params[key]);
                        else if(field.length) // field found
                            field.val(params[key]);
                        else {
                            // field not found, maybe a radio, try by name
                            try {
                                $("input[name="+prefix+"_"+key+"][value="+params[key]+"]").prop('checked', true);
                            }
                            catch(e) {
                                console.error(e);
                                throw e;
                            }
                        }
                    }
                    
                    if($('#asciinema_attachment').val() !== '') {
                        $('input[name=asciinema_srctype][value=attachment]').prop('checked', true);
                    } else if($('#asciinema_dmsf').val() !== '') {
                        $('input[name=asciinema_srctype][value=dmsf]').prop('checked', true);
                    }
                    
                    $("#asciinema_src").val(options[$("input[name=asciinema_srctype]").val()]);
                }
            },
            buttons : dlgButtons
        });
        
        // Make digits input accepting only digits
        $('#asciinema_form input.digits').keyup(function(e) {
            if(/\D/g.test(this.value)) {
                this.value = this.value.replace(/\D/g, '');
            }
        });
        
        /*$('input[name=asciinema_srctype]').on("change", function() {
            var types = ["attachment", "dmsf"];
            var others = $(types).not([this.name.replace(/^asciinema_/, ""]).get();
            
            $("#").val($("#").val());
            $("#").hide();
            $("#").show();
        });*/
        
        // Support for the redmine_wysiwyg_editor plugin
        if(typeof tinymce !== 'undefined') 
            updateTinyMCEToolbar();
    });
    
    // Initialize the jsToolBar object; called explicitly after the jsToolBar has been created
    Asciinema.initToolbar = function() {
        jsToolBar.prototype.elements.asciinema_cast = {
            type : 'button',
            after: 'img',
            title: Asciinema.strings['asciinema_title'],
            fn   : { 
                wiki: function() { 
                    openMacroDialog(dlg, getRedmineEditorAdapter(this), 'asciinema_cast', 'asciinema');
                }
            }
        };
  
        // Add a space
        jsToolBar.prototype.elements.space_asciinema = {
            type: 'space'
        }
    
        // Move back the help at the end
        var help = jsToolBar.prototype.elements.help;
        delete(jsToolBar.prototype.elements.help);
        jsToolBar.prototype.elements.help = help;
    }
})();
