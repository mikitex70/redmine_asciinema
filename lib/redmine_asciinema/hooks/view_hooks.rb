require 'redmine'

module RedmineAsciinema

    class ViewLayoutsBaseHtmlHeadHook < Redmine::Hook::ViewListener
        
        # This method will add the necessary CSS and JS scripts to the page header.
        # The scripts are loaded before the 'jstoolbar-textile.min.js' is loaded so
        # the toolbar cannot be patched.
        # A second step is required: the textile_helper.rb inserts a small Javascript
        # fragment after the jstoolbar-textile is loaded, which patches the jsToolBar
        # object.
        def view_layouts_base_html_head(context={})
            header = ''
            if context[:controller] && (context[:controller].is_a?(WikiController))
                header << stylesheet_link_tag("asciinema-player.css"  , :plugin => "redmine_asciinema", :media => "screen")
                header << stylesheet_link_tag("redmine_asciinema.css" , :plugin => "redmine_asciinema", :media => "screen")
                header << javascript_include_tag('asciinema-player.js', :plugin => 'redmine_asciinema')
                inline = <<-EOF
                <script type="text/javascript">
                    // The container for global settings
                    if(typeof(Asciinema) === "undefined")
                        Asciinema = {dmsf_enabled: #{dmsf_enabled? context}};

                    // Container for localized strings
                    Asciinema.strings = {};
                </script>
                EOF
                header << inline
                header << javascript_include_tag("lang/asciinema_jstoolbar-en.js", :plugin => "redmine_asciinema")
                header << javascript_include_tag("lang/asciinema_jstoolbar-#{current_language.to_s.downcase}.js", :plugin => "redmine_asciinema") if lang_supported? current_language.to_s.downcase
                header << javascript_include_tag("asciinema_jstoolbar.js", :plugin => "redmine_asciinema") unless ckeditor_enabled?
            end
            
            return header
        end
        
        def dmsf_enabled?(context)
            return false unless Redmine::Plugin.installed? :redmine_dmsf
            return false unless context[:project] && context[:project].module_enabled?('dmsf')
            true
        end
        
        def ckeditor_enabled?
            Setting.text_formatting == "CKEditor"
        end
        
        def lang_supported? lang
            return false if lang == 'en' # English is always loaded, avoid double load
            File.exist? "#{File.expand_path('../../../../assets/javascripts/lang', __FILE__)}/asciinema_jstoolbar-#{lang}.js"
        end
        
    end
end
