require 'redmine'

module RedmineAsciinema

    class ViewLayoutsBaseHtmlHeadHook < Redmine::Hook::ViewListener
        
        # This method will add the necessary CSS and JS scripts to the page header.
        # The scripts are loaded before the 'jstoolbar-textile.min.js' is loaded so
        # the toolbar cannot be patched.
        # A second step is required: the textile_helper.rb inserts a small Javascript
        # fragment after the jstoolbar-textile is loaded, which pathes the jsToolBar
        # object.
        def view_layouts_base_html_head(context={})
                header = ''
            if context[:controller] && (context[:controller].is_a?(WikiController))
                header << stylesheet_link_tag("asciinema-player.css"  , :plugin => "redmine_asciinema", :media => "screen")
                header << styleshhet_link_tag("redmine_asciinema.css" , :plugin => "redmine_asciinema", :media => "screen")
                header << javascript_include_tag('asciinema-player.js', :plugin => 'redmine_asciinema')
                header
            end
            
            return header
        end
    end
end
