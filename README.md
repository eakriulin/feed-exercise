# feed-exercises

## First things first

```sh
# Install dependencies
yarn install

# Prepare config file
cp config/default.example.json default.json

# Go to default.json and set up your local configuration
```

## ETL

ETL project consists of 3 entities — `Watcher`, `FileParserConsumer`, `Restorer`.

* `Watcher` is responsible for monitoring the dir where new files occur. Every time it sees a new file it pushes a job to 'jobs/parse_json_file' queue and adds a record to the database indicating that we start processing the file. Watcher runs every minute as a cronjob.
* `FileParserConsumer` is responsible for performing the business logic. It consumes the jobs from 'jobs/parse_json_file' queue, parses files, manipulates the data, and writes results to an output file. We can easily scale the number of consumers running them as a [cluster](https://nodejs.org/api/cluster.html) or using [pm2](https://www.npmjs.com/package/pm2).
* `Restorer` is responsible for monitoring stuck files. If more than an hour has passed since we started to process a file, we can say that a file is stuck. In that situation, we need to remove a file from the database (or put a special mark on it) to be able to process it once again on the next Watcher run. Restorer runs every hour as a cronjob.

To implement queueing, RabbitMQ is used. However, for the sake of simplicity, I use a plain JavaScript object as a database.

```sh
# To launch FileParserConsumer consumer
yarn dev:etl

# To launch Watcher
ts-node etl/src/cronjobs/watcher/run.ts

# to launch Restorer
ts-node etl/src/cronjobs/restorer/run.ts
```

## API

Since we need to cover API with unit tests, [Inversify](https://github.com/inversify/InversifyJS) is used to implement Dependency Injection.

To launch the server run this command:
```sh
yarn dev:api
```

Navigate to [localhost](http://localhost:8080/api/posts/23846232401280675) to perform the request and see the response.


To launch unit-tests run this command:
```sh
yarn test:api
```
