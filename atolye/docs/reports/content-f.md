# Report: content-f (Days 26-30)

## Plan (written before the content)

Everything server-side (Flask, MongoDB, HTTP, REST) becomes an honest pure-Python model that runs offline in Pyodide; each card says what the real library call looks like.

**Day 26, Flask.** Sections: Flask (folder structure), Setting up your project directory, Creating routes, Creating templates, Python Script, Navigation, Creating a layout (+ Serving Static File), Deployment.
Sequences: request -> function -> response mental model; decorator registry behind `@app.route` (review Day 14); `if __name__ == '__main__'`; `os.environ.get('PORT', 5000)`; template placeholders and `render_template(name, **context)`; Jinja `{% for %}` vs a Python loop; HTML escaping; layout/`extends`/`block`; `url_for` as reverse lookup; GET vs POST, `request.form`, POST-redirect-GET; text analyzer; requirements.txt, Procfile, why `debug=True` never goes to production, Heroku free plan gone.
Blocks: routes and dispatch; templates and rendering; GET/POST forms and the text analyzer; configuration and deployment files.

**Day 27, MongoDB.** Sections: connection string, connecting, creating db/collection, inserting many, find, find with query, find with modifier, limit, sort, update, delete, drop.
Sequences: SQL vs NoSQL vocabulary; document = dict; URI anatomy (`urllib.parse`) and secrets in environment variables; client -> database -> collection, created lazily; `insert_one` adds `_id` (and mutates your dict); `insert_many`; `find_one` -> dict or None; `find` -> lazy cursor that is used up; projection; query dict = AND of equalities; operators `$gt/$lt/$gte/$in/$ne`; `sort`/`limit` as `sorted(key=)`/slicing; `update_one` with `$set` (why it is required); `delete_one/delete_many({})`; `drop`.
Blocks: documents and insert; find, query and projection; operators, sort and limit; update and delete.

**Day 28, APIs and HTTP.** Section with code: Header Fields; the rest is prose sections (API, HTTP, structure, request line, status line, body, methods).
Sequences: API as a contract; JSON as the exchange format (review Day 19); client/server request-response cycle; message anatomy (start line, headers, blank line, body) parsed with `split`/`partition`; request line and query strings (`urllib.parse`); status codes by class, `http.HTTPStatus`; headers are case-insensitive; `Content-Length` counts bytes (Turkish letters); methods and CRUD, safe vs idempotent; what `requests`/`fetch` look like.
Blocks: request line and URLs; status codes; headers and body; methods, CRUD and JSON.

**Day 29, Building an API.** Sections: Structure of an API, Retrieving data using get, Getting a document by id, Creating data using POST, Updating using PUT, Deleting a document using Delete.
Sequences: endpoint anatomy and versioning; a `(method, path)` route table; JSON responses and `Content-Type`; serialisation errors (`datetime`, ObjectId) and `default=str`; path parameters `<id>`; 404 handling; POST with validation, 201; PUT with `$set`-style update, 404; DELETE, 204; fixing the original's bugs.
Blocks: JSON responses; routing with path parameters; create with validation; update and delete.

**Day 30, Conclusions.** No code sections in the original. A capstone review day that interleaves the whole course through the six mental models (name tags, mutability, function calls, iteration, exceptions, classes) and a small end-to-end project (text -> dicts -> functions -> class -> JSON), plus honest next steps.
Blocks: data and collections; functions and errors; classes; a capstone pipeline.
