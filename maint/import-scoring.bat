mongo local --eval "db.scoringlayout.remove({});"
mongoimport --db local --collection scoringlayout --file scoringlayout.json
