const locations = {
  fenix: {
    city: "Berlicum",
    name: "Fenix Fitness Berlicum",
    description: "A focused fitness environment for individual medical fitness, strength and personal coaching.",
    services: ["Medical Fitness", "Personal Training", "Strength Development"],
    url: "https://www.google.com/maps/search/?api=1&query=Fenix%20Fitness%20Kerkwijk%2085%20Berlicum",
  },
  fujiyama: {
    city: "Den Bosch",
    name: "Fujiyama Den Bosch",
    description: "A combat-sport environment for physical preparation around technical training.",
    services: ["MMA", "Combat Performance", "Strength & Conditioning"],
    url: "https://www.google.com/maps/search/?api=1&query=Fujiyama%20Gym%20Bilderdijkstraat%2062%20Den%20Bosch",
  },
  chi: {
    city: "’s-Hertogenbosch",
    name: "Chi Academy",
    description: "A multidisciplinary training setting for personal attention and movement development.",
    services: ["Medical Fitness", "Individual Coaching", "Personal Training"],
    url: "https://www.google.com/maps/search/?api=1&query=Chi%20Academy%20Stadionlaan%2075%20Den%20Bosch",
  },
};

const markers = document.querySelectorAll("[data-location]");
const kicker = document.querySelector("#mapLocationKicker");
const name = document.querySelector("#mapLocationName");
const description = document.querySelector("#mapLocationDescription");
const services = document.querySelector("#mapLocationServices");
const link = document.querySelector("#mapLocationLink");

function selectLocation(key) {
  const location = locations[key];
  if (!location || !kicker || !name || !description || !services || !link) return;
  kicker.textContent = location.city;
  name.textContent = location.name;
  description.textContent = location.description;
  services.replaceChildren(...location.services.map((service) => {
    const item = document.createElement("li");
    item.textContent = service;
    return item;
  }));
  link.href = location.url;
  markers.forEach((marker) => {
    const active = marker.dataset.location === key;
    marker.classList.toggle("is-active", active);
    marker.setAttribute("aria-pressed", String(active));
  });
}

markers.forEach((marker) => marker.addEventListener("click", () => selectLocation(marker.dataset.location)));
selectLocation("fenix");
