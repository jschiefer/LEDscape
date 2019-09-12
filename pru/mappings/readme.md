All the `rgb-123-no?` files are the same as the `rgb-123-v3` files 
*except* that the indicated pin is moved up to a high number (47)
so if you specify a lower strip count than you actually have, then the
indicated pin will get NO signal at all. 

I did this becuase strips were getting hot for flakey pixels and they would ruin the whole 
display. By blocking all signals to that strip, at least it would go dark
and not ruin everything. 

Note that any time you add or change a mapping file, you have to do 
a `make clean` followed by a `make all` to actually generate the `.bin` file needed.