# encoding: UTF-8

class RedmineAsciinemaHookListener < Redmine::Hook::ViewListener
    render_on :view_layouts_base_body_bottom, :partial => "redmine_asciinema/macro_dialog"
end
