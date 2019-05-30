#!/bin/bash
# Setting up conductor
open "http://localhost:8000/conductor"
# Setting up chorus
open -a Safari "http://localhost:8000/chorus"
delay

# open -a Safari "http://localhost:8000/chorus"
# open -a Safari "http://localhost:8000/chorus"
# open -a Safari "http://localhost:8000/chorus"
# open -a Safari "http://localhost:8000/chorus"

for i in {1..5}
do
  open -a Safari "http://localhost:8000/chorus"
  sleep 0.5
done
exit 0
