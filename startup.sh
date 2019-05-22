#!/bin/bash
# Setting up conductor
open "http://localhost:8000/conductor"
# Setting up chorus
for i in {1..5}
do
  open "http://localhost:8000/chorus"
done
exit 0
