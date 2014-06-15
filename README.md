====
bfjs
====

What is it
==========

**bfjs** is a javascript bookmarklet for adding live charts and related information to the 
standard Betfair screens.  It works by loading a graphing javascript library, d3.js, and 
manipulating the Betfair DOM to insert elements.  It then refreshes market prices and 
updates the chart every second.  You can see it in action [here](http://vimeo.com/65465492).

Install
=======

Simply to use the script, follow the instructions [here](http://denp1.github.io/bfjs/).

For developers, the script runs as a [bookmarklet](http://en.wikipedia.org/wiki/Bookmarklet).
To convert the javascript to a bookmarklet, two steps are required.
  * Minifiy bfpie.js using a minifier that doesn't leave newlines in the source, such as
an instance of  [YUI Compressor](http://refresh-sf.com/yui/) and prepend 'javascript:' to it.  
Or simply copy the contents of the minified version.
  * Create a bookmark in your browser, enter the result of the minification into the address 
field.  Works on Chrome, Firefox and Safari on MacOS, and Windows (except for Safari which 
wouldn't accept the bookmark on Windows).  You may need to do this via the "Manage Bookmarks"
screen as many browsers limit the length that of urls that can be entered via a dialog.

To use it, go to a "Win Only Market" (i.e. not any form of Handicap market or other
variant) such as football Match Odds, or Correct Score and click on the bookmark.

License
=======

Apache 2.0

http://www.apache.org/licenses/LICENSE-2.0


