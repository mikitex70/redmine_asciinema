Redmine::Plugin.register :redmine_asciinema do
  name 'Redmine Asciinema plugin'
  author 'Michele Tessaro'
  description 'This is a plugin for Redmine'
  version '0.2.0'
  url 'https://github.com/mikitex70/redmine_asciinema'
  author_url 'https://github.com/mikitex70'
  
  requires_redmine :version_or_higher => '3.2.0'
  
  #settings(partial: 'settings/rm_asciinema_settings',
  #         default: {'asciinema_server' => '' })
  
  #should_be_disabled false if Redmine::Plugin.installed?(:easy_extensions)
end

unless Redmine::Plugin.installed?(:easy_extensions)
  require_relative 'after_init'
end
