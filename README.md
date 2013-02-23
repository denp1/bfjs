====
bfjs
====

What is it
==========

**bfjs** is a javascript bookmarklet for added live charts and related information to the 
standard abcdef screens.  It works by loading a graphing javascript library, d3.js, and 
manipulating the abcdef DOM to insert elements.  It then refreshes market prices and 
updates the chart every second.

Install
=======

The script runs as a [bookmarklet](http://en.wikipedia.org/wiki/Bookmarklet).
To convert the javascript to a bookmarklet, two steps are required.
  * Minifiy bfpie.js using a minifier that doesn't leave newlines in the source, such as
an instance of  [YUI Compressor](http://refresh-sf.com/yui/)
  * Create a bookmark in your browser (not IE), enter 'javascript:' and the result
of the minification into the address field.

To use it, go to a "Win Only Market" (i.e. not any form of Handicap market or other
variant) such as football Match Odds, or Correct Score and click on the bookmark.

License
=======

Apache 2.0

http://www.apache.org/licenses/LICENSE-2.0


