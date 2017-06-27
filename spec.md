## manifest

```
share/    files to share with others on the network
chunks/   chunks of files your program has fetched
d.json    what your program knows about files on the network
          the gui's data source
e.json    example of the format your program should generate
```

## challenge constraints

* stick to the interface described below
* you can add features in addition to the interface but finish it first
* create your own application layer protocol. i.e. you should only need your language's udp socket api. don't start a webserver, don't use ftp, don't start a bittorrent client, don't upload the files to s3, don't use a library that is "great for transferring" files etc. the goal is to learn about network programming by doing this part yourself!

## write your backend

you can write the backend in any language. but it must support the argv (command line argument) interface and file system interface described below.

to test the gui with your backend set the `be` environment variable to the command that invokes your backend.

if your program was called `backend.py` then you would run

```
$ be='python backend.py' ./run
```

in order for your backend to work with the gui it must adhere to the interface described below

when invoked with `peer` as the only command line argument like:

```
$ python backend.py peer
```

your program should run in a mode where it periodically attempts to discover the set of shared files on the network and writes that data to `d.json`. in this mode the program should run forever

to assist with development, you can also write the list of discovered files to stdout.

when a user starts a download from the frontend, it will invoke your program like this:

```
$ python backend.py fetch {file_sha1_hash} {file_name} {file_size} {ip} [other_ips...]
```

in this mode, your program should fetch the file from one or more of the host(s) given by the `ip` and `other_ips...` parameters

in this "fetching" mode there is technically only one rule this program must follow: _it must not put a partially downloaded file in the `share` folder_. if it does this, everything will break, an alarm will sound and your computer will catch on fire.

however, if you want the "transfers" area in the gui to show useful information, then your program should represent the fetched data in the following way:

say the user clicked on a file called "hackers.mov", your program will be invoked like

```
$ python backend.py fetch 3f786850e387550fdab836ed7e6dc881de23001b "hackers.mov" 967632312 10.0.0.4 10.0.0.7
```

it should immediately create the file `chunks/3f786850e387550fdab836ed7e6dc881de23001b:attrs` who's _contents_ should be

```
{ "name": "hackers.mov", "size": 967632312 }
```

then for every partial chunk of the file fetched, it should create a corresponding "chunk file".

for example, if it fetched the first 500 bytes from some host, it should create a file called `chunks/3f786850e387550fdab836ed7e6dc881de23001b:chunk:0` and write the bytes to it. then if it fetched the next 500 bytes (perhaps from another host in parallel to speed up the download!) it should write those bytes to `chunks/3f786850e387550fdab836ed7e6dc881de23001b:chunk:500`.

note the trailing number in the filename is the starting _offset_ (byte index) of the chunk, not the the size of the chunk. because the size of the chunk is just the size of the file.

the gui will notice that these files have been written to disk and update the downloads tab with the progress accordingly.

but this is _all_ that the gui will do. it is up to your program--once it has fetched all the chunks--to:

* concatenate them together
* check the hash matches the contents
* write this fully downloaded file to `shared/{filename}`
* delete the no longer needed chunks
* exit - in fetch mode your program should run until a single file has been fully downloaded (not a single chunk, not multiple files, a single file)

when you kill the gui (or it crashes), it will kill any `peer` and `fetch` processes that it started. when you start it up again, it will re-start the `peer` process, and one fetch process for every `/chunks/chunk:{file_hash}:attrs` file.

this means that running your program in fetch mode with the same arguments should be an idempotent operation.

as to _how_ peers find each other, share the contents of their `share/` directories with each other, and transfer chunks between each other, that's all up to you and your backend. the frontend is deliberately decoupled from those architectural and implementation decisions.
