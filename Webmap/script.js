"use strict";

// prettier-ignore
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");
const workoutALL = document.querySelectorAll(".workout");
const deletebtn = document.querySelector(".delete");
const deleteitem = document.querySelector(".delete--item");
const sortbtn = document.querySelector(".sort--btn");
const bysort = document.querySelector(".sortby--btn");

const selectOption = document.querySelector(".select--option");
let map, mapEvent, containerworkoutbyid, childrenworkout, test, test1, need;
let i = 0;

class Workout {
  date = new Date();
  id = (Date.now() + " ").slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
  _description() {
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}, ${this.date.getHours()} : ${this.date.getMinutes()}'clock ${this.date.getSeconds()}`;
  }
}
class running extends Workout {
  type = "running";
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._description();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
  }
}
class clycling extends Workout {
  type = "cycling";
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.calcSpeed();
    this._description();
  }
  calcSpeed() {
    this.speed = this.duration / this.distance;
  }
}
class App {
  #map;
  #mapEvent;
  #workouts = [];
  sortthing = [];
  cloneWorkouts = [];
  inputValue;
  constructor() {
    this._getPosition();
    this._getLocalStorage();
    this._getInputLocalStorage();
    inputType.addEventListener("change", this._toggleElevationField);
    form.addEventListener("submit", this._newWorkout.bind(this));
    containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));
    deletebtn.addEventListener("click", this._reset.bind(this));
    deleteitem.addEventListener("click", this._deleteItem.bind(this));
    sortbtn.addEventListener("click", this._sortitem.bind(this));
    bysort.addEventListener("click", this._bysortitem.bind(this));
    selectOption.addEventListener("change", this._changeInputValue.bind(this));
  }
  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("COuld not get your position");
        }
      );
  }
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);
    this.#map = L.map("map", {
      editable: true,
      editOptions: {
        drawingCursor: "crosshair",
      },
    }).setView([latitude, longitude], 13);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#map.on("click", this._showForm.bind(this));
    this.#workouts.forEach((work) => {
      this.renderWorkoutMarker(work);
    });
  }
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    inputDistance.focus();
  }
  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        "";
    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => (form.style.display = "grid"), 1000);
  }

  _newWorkout(e) {
    let workout;
    e.preventDefault();
    const vaidInput = (...arrs) => {
      arrs.every((arr) => Number.isFinite(arr));
    };
    const allPositive = (...poss) => poss.every((pos) => pos > 0);

    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    if (type === "running") {
      const cadence = +inputCadence.value;
      if (
        !vaidInput(cadence, distance, duration) &&
        !allPositive(cadence, distance, duration)
      ) {
        return alert("Inputs have to be positive number");
      }
      workout = new running([lat, lng], distance, duration, cadence);
    }
    if (type === "cycling") {
      const elevation = +inputElevation.value;
      if (
        !vaidInput(elevation, distance, duration) &&
        !allPositive(elevation, distance, duration)
      ) {
        return alert("Inputs have to be positive number");
      }
      workout = new clycling([lat, lng], distance, duration, elevation);
    }
    console.log(workout);
    this.#workouts.push(workout);
    console.log(this.#workouts);
    this.cloneWorkouts.push(workout);
    console.log(this.cloneWorkouts);
    this.renderWorkoutMarker(workout);
    this._renderworkout(workout);
    this._hideForm();
    this._setLocalStorage();
    this._setCloneLocalStorage();
  }

  renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
          pane: "popupPane",
        })
      )
      .setPopupContent(
        ` ${workout.type === "running" ? "🏃" : "🚴‍♀️"} ${workout.description}`
      )
      .openPopup();
  }
  _renderworkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${
      workout.id
    }" id="workout--child" data-set="${i}">
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
      </li>
      `;

    if (workout.type === "cycling")
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevation}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>
      `;
    i++;
    form.insertAdjacentHTML("afterend", html);
    containerworkoutbyid = document.getElementById("container--workout--first");
  }
  _toggleElevationField() {
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
  }
  _moveToPopup(e) {
    if (!this.#map) return;

    const workoutEl = e.target.closest(".workout");

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      (work) => work.id === workoutEl.dataset.id
    );
    this.#map.setView(workout.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }
  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }
  _setCloneLocalStorage() {
    localStorage.setItem("clone", JSON.stringify(this.cloneWorkouts));
  }
  _getCloneLocalStorage() {
    const data = JSON.parse(localStorage.getItem("clone"));
    if (!data) return;

    this.#workouts = data;
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));
    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach((work) => {
      console.log(work);
      this._renderworkout(work);
    });
    console.log(data);
  }
  _reset(e) {
    e.preventDefault();
    localStorage.removeItem("workouts");
    location.reload();
  }
  _deleteItem() {
    document
      .querySelector(`.workout[data-set="${i - 1}"]`)
      .classList.add("hin");
    this.#workouts.splice(i - 1, 1);
    this._setLocalStorage();
    location.reload();
    i--;
    console.log(i);
  }
  _sortitem() {
    const type = this.inputValue;
    console.log(type);
    if (type === "Tăng dần") {
      let h = 0;
      test = this.#workouts
        .slice()
        .map((workout) => workout.distance)
        .sort((a, b) => a - b);
      this.sortthing = test;
      for (let k = 0; k < test.length; k++) {
        this.sortthing[h] = this.#workouts.find(
          (workout) => workout.distance === test[h]
        );
        h++;
      }
      this.#workouts = [...this.sortthing];
      this._setLocalStorage();
      this.inputValue = "Tăng dần";
      this._setInputLocalStorage();
      location.reload();
    }
    if (type === "Giảm dần") {
      let h = 0;
      test = this.#workouts
        .slice()
        .map((workout) => workout.distance)
        .sort((a, b) => b - a);
      this.sortthing = test;
      for (let k = 0; k < test.length; k++) {
        this.sortthing[h] = this.#workouts.find(
          (workout) => workout.distance === test[h]
        );
        h++;
      }
      this.#workouts = [...this.sortthing];
      this._setLocalStorage();
      this.inputValue = "Tăng dần";
      this._setInputLocalStorage();
      location.reload();
    }
  }
  _bysortitem() {
    this._getCloneLocalStorage();
    this._setLocalStorage();
    location.reload();
  }
  _setInputLocalStorage() {
    localStorage.setItem("inputLocalStorage", JSON.stringify(this.inputValue));
  }
  _getInputLocalStorage() {
    const data = JSON.parse(localStorage.getItem("inputLocalStorage"));
    if (!data) return;
    this.inputValue = data;
  }
  _changeInputValue(e) {
    this.inputValue = e.target.value;
    console.log(this.inputValue);
    this._setInputLocalStorage();
  }
}
