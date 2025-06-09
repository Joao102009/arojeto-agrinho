function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
}let plots = [];
let seedButtons = [];
let shopButtons = [];
let animals = [];
let selectedSeed = null;
let money = 100;
let harvestedCrops = [];
let nextInstantGrow = false;
let growSpeedMultiplier = 1.0;
let seller;

// --- DADOS DE SEMENTES ---
let seeds = {
  corn: { name: "Milho", cost: 5, growTime: 4000, sellPrice: 10, color: [255, 215, 0] },
  carrot: { name: "Cenoura", cost: 7, growTime: 6000, sellPrice: 15, color: [255, 120, 50] },
  wheat: { name: "Trigo", cost: 10, growTime: 8000, sellPrice: 20, color: [200, 200, 50] }
};

// --- DADOS DOS ANIMAIS ---
let animalsData = {
  cow:    { name: "Vaca",    cost: 50, sell: 40, produce: "Leite", time: 8000, color: [180, 200, 255] },
  chicken:{ name: "Galinha", cost: 30, sell: 20, produce: "Ovo",   time: 5000, color: [255, 255, 150] },
  sheep:  { name: "Ovelha",  cost: 40, sell: 30, produce: "Lã",     time: 7000, color: [240, 240, 240] }
};

function setup() {
  createCanvas(900, 600);
  textFont('Arial');

  // Canteiros
  for (let i = 0; i < 6; i++) {
    plots.push(new Plot(120 + i * 100, 300));
  }

  // Botões de sementes
  let x = 20;
  for (let key in seeds) {
    seedButtons.push(new SeedButton(x, 20, key));
    x += 130;
  }

  // Loja de melhorias
  shopButtons.push(new ShopButton(20, 80, "Regador 2.0", 30, () => { growSpeedMultiplier = 0.5; }));
  shopButtons.push(new ShopButton(160, 80, "Semente Bônus", 10, () => {
    let keys = Object.keys(seeds);
    let randomSeed = keys[int(random(keys.length))];
    harvestedCrops.push(randomSeed);
  }));
  shopButtons.push(new ShopButton(320, 80, "Fertilizante", 20, () => { nextInstantGrow = true; }));

  // Loja de animais
  shopButtons.push(new ShopButton(480, 80, "Comprar Vaca", 50, () => { addAnimal("cow"); }));
  shopButtons.push(new ShopButton(620, 80, "Comprar Galinha", 30, () => { addAnimal("chicken"); }));
  shopButtons.push(new ShopButton(760, 80, "Comprar Ovelha", 40, () => { addAnimal("sheep"); }));

  seller = new Seller(width - 100, height - 80);
}

function draw() {
  background(170, 220, 160);

  // UI
  fill(0);
  textSize(18);
  text("Dinheiro: R$" + money, 20, height - 30);
  text("Inventário: " + harvestedCrops.length, 250, height - 30);

  for (let btn of seedButtons) btn.display();
  for (let btn of shopButtons) btn.display();

  for (let plot of plots) {
    plot.update();
    plot.display();
  }

  for (let animal of animals) {
    animal.update();
    animal.display();
  }

  seller.display();
}

function mousePressed() {
  if (seller.isHovered(mouseX, mouseY)) {
    sellCrops();
    return;
  }

  for (let btn of seedButtons) {
    if (btn.isHovered(mouseX, mouseY)) {
      selectedSeed = btn.seedKey;
      return;
    }
  }

  for (let btn of shopButtons) {
    if (btn.isHovered(mouseX, mouseY)) {
      btn.buy();
      return;
    }
  }

  for (let plot of plots) {
    if (plot.isHovered(mouseX, mouseY)) {
      plot.interact();
    }
  }

  for (let animal of animals) {
    if (animal.isHovered(mouseX, mouseY)) {
      if (mouseButton === RIGHT) {
        animal.sell();
      } else {
        animal.feed();
      }
    }
  }
}

function addAnimal(type) {
  if (money >= animalsData[type].cost && animals.length < 4) {
    animals.push(new Animal(100 + animals.length * 120, 480, type));
    money -= animalsData[type].cost;
  }
}

// ---------- CLASSES ------------

class Plot {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 80;
    this.state = 'empty';
    this.seed = null;
    this.plantedTime = 0;
    this.growTime = 0;
  }

  isHovered(mx, my) {
    return dist(mx, my, this.x, this.y) < this.size / 2;
  }

  interact() {
    if (this.state === 'empty' && selectedSeed && money >= seeds[selectedSeed].cost) {
      this.seed = selectedSeed;
      this.state = 'planted';
      money -= seeds[this.seed].cost;
    } else if (this.state === 'planted') {
      this.state = 'watered';
      this.plantedTime = millis();
      let baseTime = seeds[this.seed].growTime;
      this.growTime = baseTime * growSpeedMultiplier;
      if (nextInstantGrow) {
        this.growTime = 0;
        nextInstantGrow = false;
      }
    } else if (this.state === 'grown') {
      harvestedCrops.push(this.seed);
      this.seed = null;
      this.state = 'empty';
    }
  }

  update() {
    if (this.state === 'watered') {
      if (millis() - this.plantedTime >= this.growTime) {
        this.state = 'grown';
      }
    }
  }

  display() {
    fill(100, 60, 30);
    ellipse(this.x, this.y, this.size);
    if (this.state === 'planted') {
      fill(60, 180, 60);
      ellipse(this.x, this.y, 20);
    } else if (this.state === 'watered') {
      fill(0, 120, 255);
      ellipse(this.x, this.y, 25);
    } else if (this.state === 'grown') {
      fill(...seeds[this.seed].color);
      ellipse(this.x, this.y, 35);
    }
  }
}

class SeedButton {
  constructor(x, y, seedKey) {
    this.x = x;
    this.y = y;
    this.w = 120;
    this.h = 40;
    this.seedKey = seedKey;
  }

  isHovered(mx, my) {
    return mx > this.x && mx < this.x + this.w && my > this.y && my < this.y + this.h;
  }

  display() {
    fill(selectedSeed === this.seedKey ? 180 : 255);
    stroke(0);
    rect(this.x, this.y, this.w, this.h, 8);
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(14);
    text(`${seeds[this.seedKey].name} (R$${seeds[this.seedKey].cost})`, this.x + this.w/2, this.y + this.h/2);
  }
}

class ShopButton {
  constructor(x, y, label, price, onBuy) {
    this.x = x;
    this.y = y;
    this.w = 120;
    this.h = 40;
    this.label = label;
    this.price = price;
    this.onBuy = onBuy;
  }

  isHovered(mx, my) {
    return mx > this.x && mx < this.x + this.w && my > this.y && my < this.y + this.h;
  }

  buy() {
    if (money >= this.price) {
      money -= this.price;
      this.onBuy();
    }
  }

  display() {
    fill(255);
    stroke(0);
    rect(this.x, this.y, this.w, this.h, 8);
    fill(0);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(13);
    text(`${this.label}\nR$${this.price}`, this.x + this.w / 2, this.y + this.h / 2);
  }
}

class Seller {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 70;
  }

  isHovered(mx, my) {
    return dist(mx, my, this.x, this.y) < this.size / 2;
  }

  display() {
    fill(255, 220, 180);
    ellipse(this.x, this.y, this.size);
    fill(0);
    textAlign(CENTER);
    textSize(14);
    text("Vender", this.x, this.y + this.size / 2 + 10);
  }
}

class Animal {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.data = animalsData[type];
    this.fed = false;
    this.fedTime = 0;
  }

  isHovered(mx, my) {
    return dist(mx, my, this.x, this.y) < 40;
  }

  feed() {
    if (!this.fed) {
      this.fed = true;
      this.fedTime = millis();
    }
  }

  sell() {
    money += this.data.sell;
    animals = animals.filter(a => a !== this);
  }

  update() {
    if (this.fed && millis() - this.fedTime > this.data.time) {
      harvestedCrops.push(this.type); // usar tipo como item colhido
      this.fed = false;
    }
  }

  display() {
    fill(...this.data.color);
    ellipse(this.x, this.y, 60);
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(12);
    text(this.data.name, this.x, this.y - 35);
    if (this.fed) {
      text("Produzindo...", this.x, this.y + 35);
    }
  }
}

function sellCrops() {
  let total = 0;
  for (let crop of harvestedCrops) {
    if (seeds[crop]) {
      total += seeds[crop].sellPrice;
    } else if (animalsData[crop]) {
      total += 15; // produtos animais fixos: leite, ovo, lã
    }
  }
  money += total;
  harvestedCrops = [];
}