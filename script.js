"use strict";

//
//
//
//
//
////////////////////////////////////////////////////////////////////////////
//
//     ------------------⭐ Project: Mapty ------------
//
//           MAPTY APP: OOP, GEOLOCATION, EXTERNAL LIBRARIES, AND MORE !!
//
//
////////////////////////////////////////////////////////////////////////////

//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//------------------
// Parent Class
//-----------------

class Workout {
  date = new Date();

  // Very Modern Operation: WE can use this: Yet to be Implemented by ECMA
  // Any Object should have some Unique kind of Identifier, so we can later Identify it and apply methods to it.
  // ❗ NOTE: Always use some library for creating IDs, but here: Date.now() converted to a string, and Taking the last 10 numbers: Should be Unique Enough

  id = (Date.now() + "").slice(-10);
  clicks = 0;

  constructor(coords, distance, duration) {
    // this.date = ... // Making sure it works Atleast with ES6:
    // this.id = ...

    this.coords = coords; // Array: [lat, lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  _setDescription() {
    // prettier-ignore: 💥
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    // Case Sensetive NOTE: "Running"/"Cycling": getMonth(): 0 based array
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  // Simply count the clicks, that happen on each of the workouts: It wont be displayed anywhere: Reason: TO MAKE THE Public Interface of these "classes" here , a littt=le more complete, because right now we are not calling any of the Methods OUTSIDE, of the classes themselves: We are not using any API for the Objects.

  click() {
    this.clicks++;
  }
}

//------------------
// Child Classes
//-----------------

class Running extends Workout {
  type = "running";

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    // this.type = "running";

    // Its perfectly fine to call any code in the constructor
    this.calcPace();
    this._setDescription();
  }

  // Adding Method to calculate pace
  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = "cycling";
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    // this.type = "cycling";

    this.calcSpeed();
    this._setDescription();
  }

  // Adding Method to calculate Speed
  calcSpeed() {
    // km/hr
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// // Testing out the Classes // Dev Purposes

// const run1 = new Running([23, 85], 5.2, 24, 178);
// const cycling1 = new Cycling([23, 85], 27, 95, 523);
// console.log(run1, cycling1);

//
//
//
//
//
//
//
//
//

////////////////////////////////////////////
// APPLICATION ARCHITECTURE

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

class App {
  // Class Fields Specification: ES2022: 2021/ Modern Way
  #map;
  #mapZoomLevel = 14;
  #mapEvent;
  #workouts = [];

  constructor() {
    // this.workouts = []; // Traditional/Classical Way

    // Get user's position
    this._getPosition();

    // Get Data from local storage

    this._getLocalStorage();

    // Attach event handlers
    form.addEventListener("submit", this._newWorkout.bind(this)); // Binds to the App Object
    inputType.addEventListener("change", this._toggleElevationField);
    containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          console.log(`Could not get your position`);
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    // console.log(`https://www.google.co.in/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];
    // console.log(coords);

    // console.log(this);
    this.#map = L.map("map").setView(coords, this.#mapZoomLevel);

    // console.log(map);

    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling Clicks on "map"

    this.#map.on("click", this._showForm.bind(this)); // Binds to the App Object

    // For rendering Marker, by getting data from the local storage: Refer the Last part of the code
    this.#workouts.forEach((eachWorkout) => {
      this._renderWorkoutMarker(eachWorkout);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    // Displaying the Left side form, when the user clicks on the map
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  _hideForm() {
    // Clearing Input Fields on form submission, while hitting "Enter"
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        "";
    // console.log(this.#mapEvent);

    // Removing the transition animation, set to "1s" in the CSS property: And then adding the "hidden" class back-on
    form.style.display = "none";
    form.classList.add("hidden");

    // Calling a certain callback function, after a certain time: using setTimeout()
    //  "form.style.display" should be set to "grid", should happenafter "1s" or "1000ms"

    setTimeout(() => (form.style.display = "grid"), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _newWorkout(event) {
    // Refactoring: Creating Simple Helper function for "validInputs": Arrow Function: taking arbitrary number of inputs: NOTE: using the (...) REST Parameter, we get an Array: Looping Over the Array: Checking if all of them are valid as well Positive(+ve)

    // every: It will only return true, if ALL the elements are valid and (+ve) too, as the condition says

    // 1. Helper function: validity
    const validInputs = (...inputs) =>
      inputs.every((eachInput) => Number.isFinite(eachInput));

    // 2. Helper function: all positive
    const allPositive = (...inputs) =>
      inputs.every((eachInput) => eachInput > 0);

    event.preventDefault();
    // console.log(this);

    // 1. Get Data From the "form"

    const type = inputType.value;
    const distance = Number(inputDistance.value);
    const duration = Number(inputDuration.value);
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // 3. If Workout is Running: Create Running Object 🏃‍♂️

    if (type === "running") {
      // 2. Check if the data is "VALID"
      const cadence = Number(inputCadence.value);

      // Guard Clause: check for the Oppposite to what we are interested in, and if the Opposite is True: The we simply return the function immediately
      // This is a trait of More Modern JavaScript

      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        // Helper function call

        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert("Inputs have to be positive numbers!");

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // 4. If Workout is Cycling: Create Cycling Object 🚴‍♀️

    if (type === "cycling") {
      const elevation = Number(inputElevation.value);

      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||

        // Elevation Can be nagative(-ve)
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert("Inputs have to be positive numbers!");

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // 5. Push/Add new object to the workout array

    this.#workouts.push(workout);
    console.log(workout);

    // 6. Render workout on the "map" as a Marker

    this._renderWorkoutMarker(workout);

    // 7. Render workout on the left hand side "LIST"

    this._renderWorkout(workout);

    // 8. Hide the "form" + Clear the "input fields"

    this._hideForm();

    // // Clearing Input Fields on form submission, while hitting "Enter"
    // inputDistance.value =
    //   inputDuration.value =
    //   inputCadence.value =
    //   inputElevation.value =
    //     "";

    // // console.log(this.#mapEvent);

    // 9. Set local storage: Using the localStorage 🔌 API

    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords) // Data coming directly from the workout object
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`, // Switch the color through dynaically changing CSS values
        })
      )
      .setPopupContent(
        `${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${workout.description}`
      )
      .openPopup();
  }

  // Really ❗ Important: Custom Data Attribute: data-id: We use data properties like this one, to usually build a "bridge" between the "UI", and the "DATA" we have in our Application
  _renderWorkout(workout) {
    let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
    `;

    if (workout.type === "running")
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>`;

    if (workout.type === "cycling")
      html += `
      <div class="workout__details">
       <span class="workout__icon">⚡️</span>
       <span class="workout__value">${workout.speed.toFixed(1)}</span>
       <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🗻</span>
        <span class="workout__value">${workout.elevationGain}</span>
        <span class="workout__unit">m</span>
      </div>
    </li>`;

    // Adding html as a Sibling Element to "form" Element
    form.insertAdjacentHTML("afterend", html);
  }

  _moveToPopup(event) {
    const workoutEl = event.target.closest(".workout"); // "closest": REally Selecting, the Entire Element: It is Very Important because, it contains the "data-id" sttribute, and the "id" shall be used to, find the workouts in the "workouts array": We put the "id" dynamically, in order to build A BRIDGE, between the UI (User Interface) and the "Data" that we have in our application: In our case, the Data in the "workouts array:": Because, if we do not have the id here, strored in the UI, then how would we know, which is the object in the "workouts array", that we need to SCROLL TO. Thus, we need the id here, so that we can read it and select the element, out of the workouts array, using this id.

    // console.log(workoutEl);

    // Guard Clause
    if (!workoutEl) return;

    // Getting the workout data from the "workouts array": Great USE CASE of using the "data-id" attribute by advanced DOM Manipulation

    const workout = this.#workouts.find(
      (work) => work.id === workoutEl.dataset.id
    );

    // console.log(workout);

    // Taking the co-ordinates from the element: and move the map to that position: Using 🍁 Leaflet library: Method available on all "map" objects

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // using the 🔌 API
    // workout.click(); // This Line Creates an ❌ Error at the End when we finally render the list from the data collected from the local storage API

    // ❓❓ What is the problem here? and how to solve this ?

    // The Problem: When we converted our 🔴 Objects to "String", and then back from "String "to an 🔴 Objects, we 🚫LOST the PROTOTYPE CHAIN 🤖🔗: Thus the new objects that we recovered from the local storage, are now just Regular Objects. They are now No longer objects, that were created by "running" or "cycling" child classes. Thus, they wont be able to inherit any of the Methods, in the Prototype chain. Thus, "workout.click();" is not a function anymore like before, as it is NO LOnger, in its prototype. This can be a BIG PROBLEM 😯, when we work with localStorage and OOP, like done out here.

    // FIXME: check ""_getLocalStorage()"" Method
  }

  // This does not need any parameters, as we will simply get the workouts from the "workout" property
  // localStorage: It is an API provided by the browser it self.: It is a simple "key":"value" store

  // 🟨 We can convert any 🔴 Object To a String: Using 🟡 JSON.stringify()

  // arg1: name
  // arg2: needs to be astring that we want to store, which will be associated with the key: "arg1"

  // localStorage API: Should never be used to store large amounts of Data. else 🚫 "BLOCKING" will be enforced : Hence, slow down the application : Can be used only for small projects

  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts)); // Converting 🔴 Object in JavaScript to String
  }

  // This method is going to be executed, right in the beginning, when the app loads: At that point, the workouts array is going to be empty, but if we already had some data in the storage, the we simply just set that workouts array, to the data that we had before
  // Essentially, we are restoring the data across multiple reloads, of the page.
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts")); // Parsing the data from the generated JSON file, and converting it back to OBJECT
    // console.log(data);

    // Guard Clause: Check thhe local storage for the data, check for the existing data if any

    if (!data) return;

    // Restoring Our Workouts Array

    this.#workouts = data; //  Setting that workouts array, to the data that we had before, which then needs to be rendered in the list

    // We dont want a new array, but we want to do something with each of the workout array: forEach() method
    this.#workouts.forEach((eachWorkout) => {
      this._renderWorkout(eachWorkout);

      // this._renderWorkoutMarker(eachWorkout); // Why this wont work?
      // _getLocalStorage(): is executed right at the beginning: right after the page is loaded: So we are trying to add the marker to the map, right at the beginning: However at this point the map has NOT been loaded: So essentially we are trying to add a marker, which has not been defined at this point.

      // (See "_renderWorkoutMarker(workout): .addTo(this.#map)" ) ------> 💥 First Glimpse to the nature of ASYNC JavaScript💥

      // FIXME: for workout.click(); ❗ Error

      // 1. Loop over the "const data = ...""
      // 2. Restore the OBJECT by Creating a New Object, using the class based on the data that is coming here from the localStorage
    });
  }

  // Resetting the Application Programatically via 🔌📞 API: For Public Interface

  reset() {
    localStorage.removeItem("workouts");
    // Reload the page programmatically
    location.reload();
  }
}

const app = new App();

//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
