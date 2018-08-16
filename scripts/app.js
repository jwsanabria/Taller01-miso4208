(function () {
    'use strict';


    var app = {
        isLoading: true,
        visibleCards: {},
        selectedTimetables: [],
        spinner: document.querySelector('.loader'),
        cardTemplate: document.querySelector('.cardTemplate'),
        container: document.querySelector('.main'),
        addDialog: document.querySelector('.dialog-container')
    };


    

    /*****************************************************************************
     *
     * Event listeners for UI elements
     *
     ****************************************************************************/

    document.getElementById('butRefresh').addEventListener('click', function () {
        // Refresh all of the metro stations
        app.updateSchedules();
    });

    document.getElementById('butAdd').addEventListener('click', function () {
        // Open/show the add new station dialog
        app.toggleAddDialog(true);
    });

    document.getElementById('butAddCity').addEventListener('click', function () {


        var select = document.getElementById('selectTimetableToAdd');
        var selected = select.options[select.selectedIndex];
        var key = selected.value;
        var label = selected.textContent;
        if (!app.selectedTimetables) {
            app.selectedTimetables = [];
        }
        app.getSchedule(key, label);
        app.selectedTimetables.push({key: key, label: label});
        app.saveSelectedStation();
        app.toggleAddDialog(false);
    });

    document.getElementById('butAddCancel').addEventListener('click', function () {
        // Close the add new station dialog
        app.toggleAddDialog(false);
    });


    /*****************************************************************************
     *
     * Methods to update/refresh the UI
     *
     ****************************************************************************/

    // Toggles the visibility of the add new station dialog.
    app.toggleAddDialog = function (visible) {
        if (visible) {
            app.addDialog.classList.add('dialog-container--visible');
        } else {
            app.addDialog.classList.remove('dialog-container--visible');
        }
    };

    // Updates a timestation card with the latest weather forecast. If the card
    // doesn't already exist, it's cloned from the template.

    app.updateTimetableCard = function (data) {
        var key = data.key;
        var dataLastUpdated = new Date(data.created);
        var schedules = data.schedules;
        var card = app.visibleCards[key];

        if (!card) {
            var label = data.label.split(', ');
            var title = label[0];
            var subtitle = label[1];
            card = app.cardTemplate.cloneNode(true);
            card.classList.remove('cardTemplate');
            card.querySelector('.label').textContent = title;
            card.querySelector('.subtitle').textContent = subtitle;
            card.removeAttribute('hidden');
            app.container.appendChild(card);
            app.visibleCards[key] = card;
        }

        var cardLastUpdatedElem = card.querySelector('.card-last-updated');
        var cardLastUpdated = cardLastUpdatedElem.textContent;
        if (cardLastUpdated) {
            cardLastUpdated = new Date(cardLastUpdated);
            // Bail if the card has more recent data then the data
            if (dataLastUpdated.getTime() < cardLastUpdated.getTime()) {
                return;
            }
        }

        card.querySelector('.card-last-updated').textContent = data.created;

        var scheduleUIs = card.querySelectorAll('.schedule');
        for(var i = 0; i<4; i++) {
            var schedule = schedules[i];
            var scheduleUI = scheduleUIs[i];
            if(schedule && scheduleUI) {
                scheduleUI.querySelector('.message').textContent = schedule.message;
            }
        }

        if (app.isLoading) {
            app.spinner.setAttribute('hidden', true);
            app.container.removeAttribute('hidden');
            app.isLoading = false;
        }
    };

    /*****************************************************************************
     *
     * Methods for dealing with the model
     *
     ****************************************************************************/


    app.getSchedule = function (key, label) {
        var url = 'https://api-ratp.pierre-grimaud.fr/v3/schedules/' + key;

        if ('caches' in window) {
            /*
             * Check if the service worker has already cached this city's weather
             * data. If the service worker has the data, then display the cached
             * data while the app fetches the latest data.
             */
            caches.match(url).then(function(response) {
              if (response) {
                response.json().then(function updateFromCache(json) {
                    
                  //var results = json.query.results;
                  var results = JSON.parse(JSON.stringify(json));
                  var item;
                  results.key = key;
                  results.label = label;
                  results.created = results._metadata.date;
                  results.schedules = results.result.schedules;
                  app.updateTimetableCard(results);
                });
              }
            });
          }

        

        var request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (request.readyState === XMLHttpRequest.DONE) {
                if (request.status === 200) {
                    var response = JSON.parse(request.response);
                    var result = {};
                    result.key = key;
                    result.label = label;
                    result.created = response._metadata.date;
                    result.schedules = response.result.schedules;
                    app.updateTimetableCard(result);
                }
            } else {
                // Return the initial weather forecast since no data is available.
                app.updateTimetableCard(initialStationTimetable);
            }
        };
        request.open('GET', url);
        request.send();
    };

    // Iterate all of the cards and attempt to get the latest timetable data
    app.updateSchedules = function () {
        var keys = Object.keys(app.visibleCards);
        keys.forEach(function (key) {
            app.getSchedule(key);
        });
    };

    /*
     * Fake timetable data that is presented when the user first uses the app,
     * or when the user has not saved any stations. See startup code for more
     * discussion.
     */

    var initialStationTimetable = {

        key: 'metros/1/bastille/A',
        label: 'Bastille, Direction La Défense',
        created: '2017-07-18T17:08:42+02:00',
        schedules: [
            {
                message: '0 mn'
            },
            {
                message: '2 mn'
            },
            {
                message: '5 mn'
            }
        ]


    };


    /************************************************************************
     *
     * Code required to start the app
     *
     * NOTE: To simplify this codelab, we've used localStorage.
     *   localStorage is a synchronous API and has serious performance
     *   implications. It should not be used in production applications!
     *   Instead, check out IDB (https://www.npmjs.com/package/idb) or
     *   SimpleDB (https://gist.github.com/inexorabletash/c8069c042b734519680c)
     ************************************************************************/

    /*app.getSchedule('metros/1/bastille/A', 'Bastille, Direction La Défense');
    app.selectedTimetables = [
        {key: initialStationTimetable.key, label: initialStationTimetable.label}
    ];*/

    // Save list of station time tables to localStorage.
    app.saveSelectedStation = function() {
        var selectedTimetables = JSON.stringify(app.selectedTimetables);
        //localStorage.selectedTimetables = selectedTimetables;
        /*var transaction = db.transaction('stations', IDBTransaction.READ_WRITE); 
        var objstore = transaction.objectStore('stations'); 

        for (i = 0; i < selectedTimetables.length; i++) { 
            objstore.put(selectedTimetables[i]);
        } */

        
         /* var item = JSON.parse(selectedTimetables);
          if (!('indexedDB' in window)) {return null;}
  return dbPromise.then(db => {
    const tx = db.transaction('people', 'readwrite');
    const store = tx.objectStore('people');
    return Promise.all(item.map(event => store.put(event)))
    .catch(() => {
      tx.abort();
      throw Error('Events were not added to the store');
    });
  });*/


        /*for(var i=0; i<selectedTimetables.length; i++){
            dbPromise.then(function(db) {
                var tx = db.transaction('logs', 'readwrite');
                var store = tx.objectStore('logs');
                
                store.put(selectedTimetables[i]);
                return tx.complete;
              }).then(function() {
                console.log('added item to the store os!');
              });
        }*/
   // };

    //const dbPromise = createIndexedDB();
/*    const dbPromise = idb.open('keyval-store', 1, upgradeDB => {
        upgradeDB.createObjectStore('keyval');
      });

    function createIndexedDB() {
        if (!('indexedDB' in window)) {
            console.log('This browser doesn\'t support IndexedDB');
            return;
        }

        return idb.open('test-db4', 1, function(upgradeDb) {
            if (!upgradeDb.objectStoreNames.contains('people')) {
              var peopleOS = upgradeDb.createObjectStore('people', {keyPath: 'key'});
              peopleOS.createIndex('gender', 'gender', {unique: false});
              peopleOS.createIndex('ssn', 'ssn', {unique: true});
            }
            if (!upgradeDb.objectStoreNames.contains('notes')) {
              var notesOS = upgradeDb.createObjectStore('notes', {autoIncrement: true});
              notesOS.createIndex('title', 'title', {unique: false});
            }
            if (!upgradeDb.objectStoreNames.contains('logs')) {
              var logsOS = upgradeDb.createObjectStore('logs', {keyPath: 'id',
                autoIncrement: true});
            }
          });
*/
idbKeyval.set(selectedTimetables);
      }

    function getLocalEventData() {
        if (!('indexedDB' in window)) {return null;}
        return dbPromise.then(db => {
          const tx = db.transaction('people', 'readonly');
          const store = tx.objectStore('people');
          return store.getAll();
        });
      }

      function setTimeTables(keys){
          console.log(keys);
          if (keys) {
            console.log('This browser doesn\'t support IndexedDB: ' + keys.length);
            //app.selectedTimetables = JSON.parse(app.selectedTimetables);
            keys.forEach(function(stationTime) {
                var item = JSON.parse(stationTime);
                for(var j=0; j<item.length;j++){
                    console.log(item[j]);
                    app.getSchedule(item[j].key, item[j].label);
                }
            });
        } else {
            /* The user is using the app for the first time, or the user has not
            * saved any cities, so show the user some fake data. A real app in this
            * scenario could guess the user's location via IP lookup and then inject
            * that data into the page.
            */
            //app.updateTimetableCard(initialStationTimetable);
            app.getSchedule(initialStationTimetable.key, initialStationTimetable.label);
            app.selectedTimetables = [
            {key: initialStationTimetable.key, label: initialStationTimetable.label}
            ];
            app.saveSelectedStation();
        };
    
      }
    

    //getLocalEventData().then(app.selectedTimetables);
    idbKeyval.keys().then(keys => setTimeTables(keys)).catch(err => console.log('It failed!', err));
    if (app.selectedTimetables.length>0) {
        console.log('This browser doesn\'t support IndexedDB: ' + app.selectedTimetables.length);
        //app.selectedTimetables = JSON.parse(app.selectedTimetables);
        app.selectedTimetables.forEach(function(stationTime) {
            app.getSchedule(stationTime.key, stationTime.label);
        });
    } else {
        /* The user is using the app for the first time, or the user has not
        * saved any cities, so show the user some fake data. A real app in this
        * scenario could guess the user's location via IP lookup and then inject
        * that data into the page.
        */
        //app.updateTimetableCard(initialStationTimetable);
        app.getSchedule(initialStationTimetable.key, initialStationTimetable.label);
        app.selectedTimetables = [
        {key: initialStationTimetable.key, label: initialStationTimetable.label}
        ];
        app.saveSelectedStation();
    };

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker
                 .register('./service-worker.js')
                 .then(function() { console.log('Service Worker Registered'); });
      };

})();


