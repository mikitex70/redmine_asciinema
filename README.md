redmine_asciinema
=================

This plugin allow embedding *asciinema* casts into [Redmine](http://www.redmine.org/) wiki pages.

## Requirements

- Requires Redmine v3.3+. Tested with Redmine v4.1.1.

## Installation

- install `redmine_asciinema` plugin:

  ```
  cd $REDMINE_HOME/plugins
  git clone https://github.com/mikitex70/redmine_asciinema.git
  ```
- restart Redmine to load the new plugin

## Usage

Use the macro `asciinema_cast` to insert casts in a wiki page.

The cast url can be specified with one (and only one) of these options:
* `attachment`: cast taken from wiki page attachment
* `dmsf`: cast taken from a file store with the [DMSF](https://github.com/danmunn/redmine_dmsf) management

Example:
```textile
{{asciinema_cast(attachment=demo.cast)}}

{{asciinema_cast(dmsf=path/to/video.cast)}}
```

The other supported options are (see [asciinema-player documentation](https://github.com/asciinema/asciinema-player#asciinema-player-element-attributes) for more details):
* `cols`: number of colums of terminal
* `rows`: number of rows of terminal
* `autoplay`: start play on load
* `preload`: download cast, but not start
* `loop`: restart cast after ended
* `start_at`: start at specific time
* `speed`: play speed
* `idle_time_limit`: compact terminal inactivity
* `poster`: screen preview (before playback)
* `font_size`: self explanatory
* `theme`: `asciinema-player` theme
* `title`: title of the cast, displayed in full screen mode
* `author`: author of the cast, displayed in full screen mode
* `author_url`: changes `author` in a hyperlink to the specified url
* `author_url_img`: url of the author's image


