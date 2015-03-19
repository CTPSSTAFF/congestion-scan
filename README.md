# congestion-scan
Big data query of INRIX data in a web browser (proof-of-concept)
This project aims to allow the Central Transportation Planning Staff to query Big Query-hosted INRIX traffic data via a user-friendly web interface. We anticipate relying on three principal frameworks:
* d3 javascript library for visualization of retrieved data
* Google Big Query API for querying the data
* jQuery javascript library for web page interface elements

The call chain initiated on page load is now essentially this (asynchronous in **bold**):
+ pageload-->**authorize**-->**load bigquery API**-->enable query controls-->**wait for user click**

The call chain of a user-initiated query is this:
+ onclick-->**query**-->handle response-->display results
+ ______-->**update elapsed time display** (recursive until time display cleared by other proces)
