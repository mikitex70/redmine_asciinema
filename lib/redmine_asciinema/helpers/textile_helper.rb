# encoding: utf-8
require 'redmine'

# With Rails 5 there is some problem using the `alias_method`, can generate
# a `stack level too deep` exeception.
if Rails::VERSION::STRING < '5.0.0'
    # Rails 4, the `alias_method` can be used
    module Redmine::WikiFormatting::Textile::Helper
        def heads_for_wiki_formatter_with_asciinema
            heads_for_wiki_formatter_without_asciinema
            unless @heads_for_wiki_formatter_with_asciinema_included
                # This code is executed only once and inserts a javascript code
                # that patches the jsToolBar adding the new buttons.
                # After that, all editors in the page will get the new buttons.
                content_for :header_tags do
                    javascript_tag 'if(typeof(Asciinema) !== "undefined") Asciinema.initToolbar();'
                end
                @heads_for_wiki_formatter_with_asciinema_included = true
            end
        end
        
        alias_method :heads_for_wiki_formatter_without_asciinema, :heads_for_wiki_formatter
        alias_method :heads_for_wiki_formatter, :heads_for_wiki_formatter_with_asciinema
    end
else
    # Rails 5, use new new `prepend` method
    module RedmineAsciinema_textile
        def heads_for_wiki_formatter
            super
            unless @heads_for_wiki_formatter_with_asciinema_included
                # This code is executed only once and inserts a javascript code
                # that patches the jsToolBar adding the new buttons.
                # After that, all editors in the page will get the new buttons.
                content_for :header_tags do
                    javascript_tag 'if(typeof(Asciinema) !== "undefined") Asciinema.initToolbar();'
                end
                @heads_for_wiki_formatter_with_asciinema_included = true
            end
        end
    end
    
    module Redmine::WikiFormatting::Textile::Helper
        prepend RedmineAsciinema_textile
    end
end
