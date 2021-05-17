# encoding: utf-8
require 'redmine'
 
Redmine::WikiFormatting::Macros.register do
    desc <<EOF
FIXME
EOF

    macro :asciinema_cast do |obj, args|
        return "«Please save content first»" unless obj
        return "asciinema animations are available only wiki pages»" unless obj.is_a?(WikiContent)
        
        optNames = [:cols, :rows, :autoplay, :preload, :loop, :start_at, :speed, :idle_time_limit, :poster, :font_size, :theme, :title, :author, :author_url, :author_url_img]
        
        args, options = extract_macro_options(args, *(optNames+[:attachment, :dmsf]))

        container = obj.page
        project = container.wiki.project
        
        if !(options[:attachment].blank?)
            attachment = container.attachments.where(filename: options[:attachment]).last
            url = url_for(:controller => 'attachments', :action => 'download', :id => attachment.id)
        elsif Redmine::Plugin.installed?(:redmine_dmsf) && !(options[:dmsf].blank?)
            folderName = File.dirname(options[:dmsf])
            folder = DMSF_helper.deep_folder_search(project, folderName)
            # Search the document in DMSF
            file = DmsfFile.find_file_by_name project, folder, File.basename(options[:dmsf])
            url = url_for(:controller => :dmsf_files, :action => 'view', :id => file)
        else
            return "«Please specify a cast source»".html_safe
        end
        
        options = options.slice(*optNames)  # keep only valid options
        options[:src] = url                 # add the url option
        # convert in a string of attributes/values to use in HTML
        opts = options.map {|k,v| if v then "#{k.to_s.gsub('_', '-')}=\"#{v.gsub('"', '&quot;')}\"" else nil end }.compact.join(' ')
        
        return "<asciinema-player #{opts}></asciinema-player>".html_safe
    end
end
