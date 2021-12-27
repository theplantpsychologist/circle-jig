# circle-jig
A physical simulation of circle packing. This tool allows users to import treemaker files to be able to view the rivers of the design, which TreeMaker does not display, and then manipulate flaps in a way that shows how flaps interact with one another and push each other into place. The tool also helps the user to increase the efficiency of the packing.

Instructions:
1. Import a .tmd5 file from Treemaker
2. Click and drag circles around
3. To find a more optimal packing, select the option that says "Let the square tighten"
4. To fix invalid paths, select the option that says "Let the square expand"

How the Circle Jig works

-When two flaps form an invalid path, they are both moved in opposite directions an incremental distance proportional to the amount they were overlapping

-When a flap is pushed off the edge, it is immediately placed back into the square, forcing whatever flap that pushed it out in the first place to readjust instead

-The square will only shrink if the option is selected and there are no invalid paths. If there are invalid paths, it will wait until they get fixed before continuing to shrink

-The square will only expand if the option is selected and there is at least one invalid path. By expanding, it gives the flaps more room to move, and the invalid path will fix itself

-River construction: let's just say it's complicated

================

Features for future updates:

-Importing bp studio files in addition to treemaker files

-Exporting as bp studio or treemaker files

-Implementing the universal molecule algorithm to construct a foldable crease pattern

-Constraints (ex: symmetry, fixed positions, active paths)

-Increased efficiency for high complexity files

================

Known issues:

-Sometimes flaps within a river will have undesired blue space between them

-Flaps do not move smoothly when pushed by multiple directions
