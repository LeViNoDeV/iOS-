// LifeSim Boss Mode: run a real business. You set prices, wages, staffing and marketing;
// customers, revenue and costs follow from those choices. The business has its own bank account,
// can borrow, raise money from investors and go public, and throws real decisions at you each year.
"use strict";

// tickets: what a customer pays at budget / standard / premium prices. visits: customers per location per year.
const Industries = {
  coffee: { name: "Coffee shop", short: "Coffee", emoji: "☕", startup: 120000, rent: 60000, staffPer: 5, wage: 32000, tickets: [4, 6, 8.5], visits: 60000, cogs: 0.3, multiple: 2.5, unit: "customers", place: "café", food: true },
  restaurant: { name: "Restaurant", short: "Kitchen", emoji: "🍽️", startup: 350000, rent: 96000, staffPer: 14, wage: 34000, tickets: [16, 30, 65], visits: 32000, cogs: 0.32, multiple: 2.5, unit: "diners", place: "restaurant", food: true },
  salon: { name: "Hair salon", short: "Salon", emoji: "💇", startup: 90000, rent: 42000, staffPer: 6, wage: 34000, tickets: [25, 55, 120], visits: 6000, cogs: 0.12, multiple: 2.2, unit: "clients", place: "salon" },
  gym: { name: "Gym", short: "Fitness", emoji: "🏋️", startup: 250000, rent: 120000, staffPer: 7, wage: 36000, tickets: [300, 600, 1500], visits: 800, cogs: 0.06, multiple: 3, unit: "members", place: "gym" },
  clothing: { name: "Clothing brand", short: "Apparel", emoji: "👕", startup: 150000, rent: 40000, staffPer: 6, wage: 45000, tickets: [25, 50, 120], visits: 15000, cogs: 0.45, multiple: 3, unit: "orders", place: "store" },
  tech: { name: "Software startup", short: "Labs", emoji: "💻", startup: 250000, rent: 90000, staffPer: 8, wage: 115000, tickets: [60, 150, 400], visits: 0, cogs: 0.15, multiple: 6, unit: "subscribers", place: "office", tech: true },
  construction: { name: "Construction company", short: "Builders", emoji: "🏗️", startup: 500000, rent: 80000, staffPer: 16, wage: 55000, tickets: [180000, 320000, 600000], visits: 10, cogs: 0.62, multiple: 3.5, unit: "projects", place: "crew" },
  dealership: { name: "Car dealership", short: "Motors", emoji: "🚘", startup: 1500000, rent: 250000, staffPer: 16, wage: 55000, tickets: [22000, 38000, 75000], visits: 420, cogs: 0.88, multiple: 3.5, unit: "cars sold", place: "lot" },
};
const industryOf = (b) => Industries[b.typeId] || Industries.coffee;

const PriceLevels = { budget: ["Budget", 0, 1.35], standard: ["Standard", 1, 1], premium: ["Premium", 2, 0.6] };
const WageLevels = { low: ["Below market", 0.85, 35], fair: ["Market rate", 1, 60], high: ["Generous", 1.2, 85] };
const MarketingLevels = { none: ["None", 0, 0.9], local: ["Local", 12000, 1.05], regional: ["Regional", 35000, 1.15], national: ["National", 400000, 1.3] };
const OwnerPay = [0, 40000, 80000, 150000, 300000, 600000, 1200000];
const FundingRounds = [["Seed round", 500], ["Series A", 5000], ["Series B", 50000], ["Series C", 300000]];

const staffNeeded = (b) => (industryOf(b).tech ? Math.max(3, Math.ceil(b.users / 2500)) : industryOf(b).staffPer * b.locations);
const marketingCost = (b) => (b.marketing === "national" ? MarketingLevels.national[1] : MarketingLevels[b.marketing][1] * Math.max(1, b.locations));
const ownerStake = (b) => b.stake ?? 1;

function startBusiness(L, typeId) {
  const t = Industries[typeId];
  if (L.age < 18) return out(L, "Boss Mode", "I'm too young to start a business.", false);
  if (inPrison(L)) return out(L, "Boss Mode", "I can't start a business from prison.", false);
  if (L.money < t.startup) return out(L, "Boss Mode", `Opening a ${t.name.toLowerCase()} takes ${formatMoney(t.startup)} up front.`, false);
  L.money -= t.startup;
  const working = Math.round(t.startup * 0.25); // a quarter of the startup money stays in the business account
  const b = {
    id: uid(), typeId, name: `${L.lastName} ${t.short}`, founded: L.age, years: 0, locations: 1, staff: t.tech ? 3 : t.staffPer,
    price: "standard", wage: "fair", marketing: t.tech ? "none" : "local", quality: 50, reputation: t.tech ? 30 : 45, morale: 60,
    cash: working, debt: 0, salary: 0, stake: 1, round: 0, users: t.tech ? 200 : 0, isPublic: false, ceo: true,
    last: null, history: [], losingYears: 0, competitor: 0, priceWar: 0, valuation: t.startup,
  };
  L.businesses = (L.businesses || []).concat([b]);
  requestName(L, "business", b.id);
  adjust(L, { happiness: 8 });
  return out(L, "Boss Mode", `${t.emoji} I opened my own ${t.name.toLowerCase()}: ${b.name}. I put ${formatMoney(working)} of the ${formatMoney(t.startup)} into its bank account to cover the first bills.`);
}

/// One year of trading. Returns last year's numbers.
function runBusinessYear(L, b) {
  const t = industryOf(b);
  const econ = clamp(1 + (L.housing ? L.housing.last : 0) * 1.5, 0.7, 1.15);
  const wage = WageLevels[b.wage];
  const staffRatio = b.staff / staffNeeded(b);
  // People: pay drives morale; morale and staffing drive quality.
  b.morale = clamp(Math.round(b.morale + (wage[2] - b.morale) * 0.4 + (staffRatio < 0.85 ? -10 : 0) + rnd(-4, 4)), 0, 100);
  // For software, engineers beyond the minimum make a better product.
  const qTarget = 25 + b.morale * 0.55 + (staffRatio >= 1 ? 5 : -15) + (t.tech ? clamp((staffRatio - 1) * 20, 0, 20) : 0);
  b.quality = clamp(Math.round(b.quality + (qTarget - b.quality) * 0.3 + rnd(-3, 3)), 0, 100);
  const priceIdx = PriceLevels[b.price][1];
  let priceDemand = PriceLevels[b.price][2];
  if (b.price === "premium") priceDemand = 0.35 + b.quality / 200;
  const mkt = MarketingLevels[b.marketing][2];
  let ticket = t.tickets[priceIdx];
  if (b.priceWar > 0) { ticket *= 0.85; priceDemand *= 1.1; }
  let customers;
  if (t.tech) {
    // Growth comes from the product, marketing, price and investor money, and slows as you get big.
    const raw = (b.quality - 50) / 70 + { none: 0, local: 0.03, regional: 0.1, national: 0.25 }[b.marketing] + (b.price === "budget" ? 0.08 : b.price === "premium" ? -0.1 : 0) + b.round * 0.1 + rndf(-0.15, 0.3);
    const growth = raw > 0 ? raw * (1.4 - Math.min(1, Math.log10(Math.max(10, b.users)) / 7)) : raw;
    b.growth = growth;
    b.users = Math.max(50, Math.round(b.users * (1 + growth) * econ));
    customers = b.users;
  } else {
    const rep = 0.6 + b.reputation / 125;
    const demand = t.visits * b.locations * rep * priceDemand * mkt * econ * (b.competitor > 0 ? 0.85 : 1) * rndf(0.9, 1.1);
    customers = Math.round(demand * Math.min(1, staffRatio));
  }
  const revenue = Math.round(customers * ticket);
  const unitCost = t.tickets[1] * t.cogs * (b.price === "premium" ? 1.3 : 1);
  const costs = {
    wages: Math.round(b.staff * t.wage * wage[1]),
    rent: t.tech ? Math.ceil(b.staff / 40) * t.rent : t.rent * b.locations,
    supplies: t.tech ? Math.round(revenue * t.cogs + b.users * 2) : Math.round(customers * unitCost),
    marketing: marketingCost(b),
    interest: Math.round(b.debt * 0.09),
    owner: b.ceo ? b.salary : 0,
  };
  const totalCosts = Object.values(costs).reduce((s, x) => s + x, 0);
  const pretax = revenue - totalCosts;
  const tax = pretax > 0 ? Math.round(pretax * 0.21) : 0;
  const profit = pretax - tax;
  b.cash += profit;
  if (b.ceo && b.salary) L.money += Math.round(b.salary * 0.75);
  // Reputation follows quality, with a push from big marketing.
  b.reputation = clamp(Math.round(b.reputation + (b.quality - b.reputation) * 0.3 + (b.marketing === "national" ? 3 : 0) + rnd(-3, 3)), 0, 100);
  b.competitor = Math.max(0, b.competitor - 1);
  b.priceWar = Math.max(0, b.priceWar - 1);
  b.years += 1;
  b.last = { revenue, costs, tax, profit, customers };
  b.history.push({ age: L.age, revenue, profit });
  if (b.history.length > 8) b.history.shift();
  return b.last;
}

function businessValuation(b) {
  const t = industryOf(b);
  const recent = b.history.slice(-3);
  const avgProfit = recent.length ? recent.reduce((s, x) => s + x.profit, 0) / recent.length : 0;
  let v;
  if (t.tech) {
    const rev = b.last ? b.last.revenue : 0;
    v = Math.max(b.users * 40, rev * (4 + clamp((b.growth || 0) * 20, 0, 16)));
  } else {
    v = Math.max(0, avgProfit * t.multiple) + b.locations * t.startup * 0.35;
  }
  return Math.max(0, Math.round((v + b.cash - b.debt) / 1000) * 1000);
}

/// Upgrades businesses from older saves.
function normalizeBusiness(b) {
  if (b.locations != null) return b;
  if (!Industries[b.typeId]) b.typeId = b.typeId === "label" ? "clothing" : "coffee";
  const t = industryOf(b);
  Object.assign(b, {
    locations: Math.max(1, Math.floor(b.stage || 1)), staff: b.employees || t.staffPer, price: "standard", wage: "fair", marketing: "local",
    quality: 50, morale: 60, cash: 0, debt: 0, salary: 0, stake: b.isPublic ? 0.7 : 1, round: 0, users: t.tech ? Math.round(1000 * (b.stage || 1)) : 0,
    ceo: true, last: null, history: [], competitor: 0, priceWar: 0, valuation: b.value || t.startup, years: 0, losingYears: 0,
  });
  return b;
}

function progressBusinesses(L) {
  for (const b of [...(L.businesses || [])]) {
    normalizeBusiness(b);
    const r = runBusinessYear(L, b);
    // Out of cash: the bank's credit line covers it, up to a point.
    if (b.cash < 0) {
      b.debt += -b.cash;
      b.cash = 0;
      const limit = Math.max(industryOf(b).startup, (r.revenue || 0) * 0.6);
      if (b.debt > limit) {
        L.businesses = L.businesses.filter((x) => x.id !== b.id);
        notify(L, "📉", "Bankrupt", `📉 ${b.name} ran out of money and couldn't borrow any more. It went bankrupt and closed its doors.`);
        adjust(L, { happiness: -20 });
        continue;
      }
      record(L, `⚠️ ${b.name} ran out of cash and drew on its credit line. It owes ${formatMoney(b.debt)}.`);
    }
    b.losingYears = r.profit < 0 ? b.losingYears + 1 : 0;
    b.valuation = businessValuation(b) * ownerStake(b);
    record(L, `${industryOf(b).emoji} ${b.name}: ${formatMoney(r.revenue)} in sales, ${r.profit >= 0 ? `${formatMoney(r.profit)} profit` : `${formatMoney(-r.profit)} loss`}.`);
    if (!b.ceo && b.isPublic) {
      const dividend = Math.max(0, Math.round(r.profit * 0.3 * ownerStake(b)));
      if (dividend) { L.money += Math.round(dividend * 0.85); }
    }
    if (b.ceo && roll(0.35) && !L.pendingEvents.some((e) => e.data && e.data.biz === b.id)) businessEvent(L, b);
    // A public company's board loses patience with a losing CEO who doesn't control the votes.
    if (b.isPublic && b.ceo && ownerStake(b) < 0.5 && b.losingYears >= 2 && roll(0.5)) {
      b.ceo = false;
      notify(L, "🪑", "Fired by the Board", `🪑 The board of ${b.name} voted me out as CEO after two losing years. I still own ${Math.round(ownerStake(b) * 100)}% of the shares.`);
      adjust(L, { happiness: -15 });
    }
  }
}

function businessEvent(L, b) {
  const t = industryOf(b);
  const options = [];
  if (t.food) options.push("inspection");
  options.push("poached", "competitor", "lawsuit");
  if (b.wage === "low") options.push("strike", "strike");
  if (b.valuation > 1000000 && !b.isPublic) options.push("buyout");
  if (t.tech && b.users > 2000) options.push("outage");
  const kind = pick(options);
  const d = { biz: b.id };
  switch (kind) {
    case "inspection": packEvent(L, "bizInspection", d, `A health inspector walked into ${b.name} unannounced.`, ["Show them around", "Slip them some cash to go easy"]); break;
    case "poached": packEvent(L, "bizPoached", d, `A competitor is trying to hire away the best manager at ${b.name}.`, ["Match their offer (+$25,000 a year)", "Let them go"]); break;
    case "competitor": packEvent(L, "bizCompetitor", d, `A big chain is opening a ${t.place} right across the street from ${b.name}.`, ["Start a price war", `Invest in quality (${formatMoney(Math.max(15000, Math.round(t.startup * 0.15)))})`, "Ride it out"]); break;
    case "lawsuit": packEvent(L, "bizLawsuit", d, `A customer is suing ${b.name} after a slip-and-fall.`, ["Settle for $30,000", "Fight it in court"]); break;
    case "strike": packEvent(L, "bizStrike", d, `The staff at ${b.name} are threatening to walk out over low pay.`, ["Raise wages to market rate", "Hold firm"]); break;
    case "buyout": { const offer = Math.round(businessValuation(b) * rndf(1.0, 1.3) / 1000) * 1000; d.offer = offer; packEvent(L, "bizBuyout", d, `A rival company offered to buy ${b.name} for ${formatMoney(offer)}.`, ["Accept the offer", "Turn it down"]); break; }
    case "outage": packEvent(L, "bizOutage", d, `${b.name}'s servers went down for two days and customers are furious.`, ["Apologize and give everyone a free month", "Blame the cloud provider"]); break;
  }
}

packEvents({
  bizInspection: {
    emoji: "🧑‍⚕️", title: "Health Inspection",
    resolve: (L, d, c) => {
      const b = (L.businesses || []).find((x) => x.id === d.biz); if (!b) return "The inspector left.";
      if (c === 0) {
        if (b.quality >= 45 || roll(0.3)) { b.reputation = Math.min(100, b.reputation + 3); return `✅ ${b.name} passed the health inspection with flying colors.`; }
        b.cash -= 15000; b.reputation = Math.max(0, b.reputation - 15); return `❌ ${b.name} failed the inspection. A $15,000 fine and a bad grade in the window.`;
      }
      L.karma -= 5;
      if (roll(0.65)) { b.cash -= 2000; return "The inspector pocketed the cash and gave us a pass."; }
      L.criminalRecord.push("Bribery"); b.cash -= 50000; b.reputation = Math.max(0, b.reputation - 20);
      return `🚔 The inspector reported the bribe. ${b.name} paid a $50,000 fine and it made the local news.`;
    },
  },
  bizPoached: {
    emoji: "🧑‍💼", title: "Poaching",
    resolve: (L, d, c) => {
      const b = (L.businesses || []).find((x) => x.id === d.biz); if (!b) return "Never mind.";
      if (c === 0) { b.cash -= 25000; b.morale = Math.min(100, b.morale + 8); return `I matched the offer. My manager stayed and the team noticed.`; }
      b.quality = Math.max(0, b.quality - 10); b.morale = Math.max(0, b.morale - 6); return `My best manager left for the competition. Things slipped for a while.`;
    },
  },
  bizCompetitor: {
    emoji: "🏪", title: "New Competition",
    resolve: (L, d, c) => {
      const b = (L.businesses || []).find((x) => x.id === d.biz); if (!b) return "Never mind.";
      if (c === 0) { b.priceWar = 2; return `I cut prices to fight the new chain. Margins will hurt for two years, but we'll keep our customers.`; }
      if (c === 1) { const cost = Math.max(15000, Math.round(industryOf(b).startup * 0.15)); b.cash -= cost; b.quality = Math.min(100, b.quality + 15); b.competitor = 1; return `I spent ${formatMoney(cost)} making ${b.name} better than the chain could ever be.`; }
      b.competitor = 2; return `I decided to ride it out. Some customers will try the new place.`;
    },
  },
  bizLawsuit: {
    emoji: "⚖️", title: "Lawsuit",
    resolve: (L, d, c) => {
      const b = (L.businesses || []).find((x) => x.id === d.biz); if (!b) return "The case was dropped.";
      if (c === 0) { b.cash -= 30000; return "We settled for $30,000 and moved on."; }
      if (roll(0.55)) { b.cash -= 12000; return "We fought it and won. Legal fees were $12,000."; }
      b.cash -= 140000; b.reputation = Math.max(0, b.reputation - 5); return "We fought it and lost. Damages and legal fees came to $140,000.";
    },
  },
  bizStrike: {
    emoji: "✊", title: "Staff Revolt",
    resolve: (L, d, c) => {
      const b = (L.businesses || []).find((x) => x.id === d.biz); if (!b) return "Never mind.";
      if (c === 0) { b.wage = "fair"; b.morale = Math.min(100, b.morale + 15); return `I raised wages at ${b.name} to the market rate. The staff were relieved.`; }
      if (roll(0.5)) { b.morale = Math.max(0, b.morale - 15); b.quality = Math.max(0, b.quality - 10); b.cash -= Math.round((b.last?.revenue || 0) * 0.1); return `The staff walked out for weeks. ${b.name} lost a chunk of the year's sales.`; }
      b.morale = Math.max(0, b.morale - 8); return "The staff grumbled but stayed. For now.";
    },
  },
  bizBuyout: {
    emoji: "🤝", title: "Buyout Offer",
    resolve: (L, d, c) => {
      const b = (L.businesses || []).find((x) => x.id === d.biz); if (!b) return "The offer expired.";
      if (c === 1) return `I turned down ${formatMoney(d.offer)} for ${b.name}. It's not for sale.`;
      return sellBusinessFor(L, b, d.offer);
    },
  },
  bizOutage: {
    emoji: "🔌", title: "Outage",
    resolve: (L, d, c) => {
      const b = (L.businesses || []).find((x) => x.id === d.biz); if (!b) return "Never mind.";
      if (c === 0) { b.cash -= Math.round((b.last?.revenue || 0) / 12); b.reputation = Math.min(100, b.reputation + 4); return "I apologized publicly and gave everyone a free month. Most users forgave us."; }
      b.reputation = Math.max(0, b.reputation - 12); b.users = Math.round(b.users * 0.9); return "Blaming the cloud provider didn't go over well. We lost 10% of our users.";
    },
  },
});

function sellBusinessFor(L, b, price) {
  const mine = Math.round(price * ownerStake(b));
  const tax = Math.round(Math.max(0, mine - industryOf(b).startup) * 0.2);
  L.businesses = L.businesses.filter((x) => x.id !== b.id);
  L.money += mine - tax;
  adjust(L, { happiness: 10 });
  bump(L, "exits");
  return `🤝 I sold ${b.name} for ${formatMoney(price)}${ownerStake(b) < 1 ? `. My ${Math.round(ownerStake(b) * 100)}% stake came to ${formatMoney(mine)}` : ""}. After ${formatMoney(tax)} in capital gains tax I walked away with ${formatMoney(mine - tax)}.`;
}

/// Changes a setting: price, wage, marketing or the owner's salary.
function setBusiness(L, id, field, value) {
  const b = (L.businesses || []).find((x) => x.id === id);
  if (!b || !b.ceo) return;
  if (field === "salary") value = Number(value);
  b[field] = value;
}

function businessAction(L, id, action, arg) {
  const b = (L.businesses || []).find((x) => x.id === id);
  if (!b) return out(L, "Boss Mode", "That business no longer exists.", false);
  const t = industryOf(b);
  if (!b.ceo && !["sellShares", "sell"].includes(action)) return out(L, b.name, "I'm not running it anymore. I can only sell my shares.", false);
  let m;
  switch (action) {
    case "hire": {
      const n = arg || 1;
      b.staff += n; b.cash -= 2000 * n;
      m = `👔 I hired ${plural(n, "new employee")} at ${b.name}. We have ${b.staff} staff now (${staffNeeded(b)} needed).`;
      return out(L, b.name, m, false);
    }
    case "fire": {
      const n = Math.min(arg || 1, b.staff - 1);
      if (n <= 0) return out(L, b.name, "I can't run it with nobody.", false);
      b.staff -= n; b.morale = Math.max(0, b.morale - 5 * n); b.cash -= Math.round(t.wage * 0.15 * n);
      m = `✂️ I laid off ${plural(n, "employee")} at ${b.name}, with severance. Morale took a hit.`;
      return out(L, b.name, m, false);
    }
    case "quality": {
      if (usedThisYear(L, `biz-${id}-quality`)) return out(L, b.name, "I already did that this year.", false);
      const cost = Math.max(15000, Math.round(t.startup * 0.12 * (t.tech ? 1 : b.locations)));
      if (b.cash < cost) return out(L, b.name, `That costs ${formatMoney(cost)} from the business account.`, false);
      markUsed(L, `biz-${id}-quality`);
      b.cash -= cost; const gain = rnd(8, 16); b.quality = Math.min(100, b.quality + gain);
      m = t.tech ? `🧪 I put ${formatMoney(cost)} into engineering at ${b.name}. The product got noticeably better (+${gain} quality).`
        : `✨ I put ${formatMoney(cost)} into better ${t.food ? "ingredients and training" : "equipment and training"} at ${b.name} (+${gain} quality).`;
      break;
    }
    case "expand": {
      const cost = Math.round(t.startup * 0.85);
      if (t.tech) return out(L, b.name, "A software company grows by hiring, not opening locations.", false);
      if (b.cash < cost) return out(L, b.name, `A new ${t.place} costs ${formatMoney(cost)} from the business account.`, false);
      b.cash -= cost; b.locations += 1;
      m = `🏢 I opened ${b.name}'s ${ordinal(b.locations)} ${t.place} for ${formatMoney(cost)}. It needs ${t.staffPer} more staff.`;
      break;
    }
    case "closeLocation":
      if (b.locations <= 1) return out(L, b.name, "That's our only one.", false);
      b.locations -= 1; b.cash += Math.round(t.startup * 0.2);
      m = `🔒 I closed one of ${b.name}'s ${t.place}s and sold the fittings.`;
      break;
    case "loan": {
      const room = Math.max(0, Math.round(Math.max(t.startup, (b.last?.revenue || 0) * 0.5) - b.debt));
      const amount = Math.min(room, arg || room);
      if (amount <= 0) return out(L, b.name, "The bank won't lend us any more right now.", false);
      b.debt += amount; b.cash += amount;
      m = `🏦 ${b.name} borrowed ${formatMoney(amount)} at 9% interest.`;
      break;
    }
    case "repay": {
      const amount = Math.min(b.debt, b.cash);
      if (amount <= 0) return out(L, b.name, "Nothing to repay, or no cash to do it with.", false);
      b.debt -= amount; b.cash -= amount;
      m = `🏦 ${b.name} paid down ${formatMoney(amount)} of debt.${b.debt ? ` ${formatMoney(b.debt)} left.` : " It's debt-free."}`;
      break;
    }
    case "invest": {
      const amount = arg || 50000;
      if (L.money < amount) return out(L, b.name, `I don't have ${formatMoney(amount)}.`, false);
      L.money -= amount; b.cash += amount;
      m = `💼 I put ${formatMoney(amount)} of my own money into ${b.name}.`;
      break;
    }
    case "withdraw": {
      const amount = Math.min(b.cash, arg || b.cash);
      if (amount <= 0) return out(L, b.name, "There's no cash to take out.", false);
      b.cash -= amount; const net = Math.round(amount * ownerStake(b) * 0.85);
      L.money += net;
      m = `💵 I paid myself a ${formatMoney(amount)} dividend from ${b.name}. After tax${ownerStake(b) < 1 ? " and the other shareholders' cut" : ""} I got ${formatMoney(net)}.`;
      break;
    }
    case "fundraise": {
      if (!t.tech) return out(L, b.name, "Investors want a high-growth tech company.", false);
      const r = FundingRounds[b.round];
      if (!r) return out(L, b.name, "We've raised all the private rounds we can. Next stop: going public.", false);
      if (b.users < r[1]) return out(L, b.name, `Investors want at least ${formatCount(r[1])} subscribers for a ${r[0]}.`, false);
      if (usedThisYear(L, `biz-${id}-raise`)) return out(L, b.name, "I already pitched investors this year.", false);
      markUsed(L, `biz-${id}-raise`);
      if (!roll(0.45 + b.quality / 250 + Math.max(0, b.growth || 0))) return out(L, b.name, `🎤 I pitched ${b.name} to investors for a ${r[0]}. They passed: "Come back when growth picks up."`);
      const pre = Math.max(businessValuation(b), b.users * 60);
      const raise = Math.round(pre * 0.25 / 1000) * 1000;
      b.cash += raise; b.stake = ownerStake(b) * 0.8; b.round += 1;
      m = `🚀 ${b.name} closed a ${r[0]}: ${formatMoney(raise)} from investors for 20% of the company. I own ${Math.round(b.stake * 100)}% now.`;
      break;
    }
    case "ipo": {
      const v = businessValuation(b);
      if (b.isPublic) return out(L, b.name, "We're already public.", false);
      if (v < 150000000) return out(L, b.name, `Banks will only take a company public at a $150M+ valuation. We're at ${formatMoney(v)}.`, false);
      b.isPublic = true;
      const newCash = Math.round(v * 0.2);
      b.cash += newCash;
      const sold = Math.round(v * ownerStake(b) * 0.1);
      L.money += Math.round(sold * 0.8);
      b.stake = ownerStake(b) * 0.8 * 0.9;
      bump(L, "ipos");
      adjust(L, { happiness: 20 });
      m = `🔔 ${b.name} went public at a ${formatMoney(v)} valuation, raising ${formatMoney(newCash)}. I sold some shares for ${formatMoney(sold)} and still own ${Math.round(b.stake * 100)}%.`;
      break;
    }
    case "sellShares": {
      if (!b.isPublic) return out(L, b.name, "The company isn't public.", false);
      const part = Math.min(ownerStake(b), 0.1);
      const value = Math.round(businessValuation(b) * part);
      b.stake = ownerStake(b) - part;
      L.money += Math.round(value * 0.8);
      m = `📈 I sold ${Math.round(part * 100)}% of ${b.name} on the stock market for ${formatMoney(value)}. I own ${Math.round(b.stake * 100)}% now.`;
      if (b.stake <= 0.001) { L.businesses = L.businesses.filter((x) => x.id !== b.id); m += " I'm fully out."; }
      break;
    }
    case "sell": {
      const offer = Math.round(businessValuation(b) * rndf(0.85, 1.1) / 1000) * 1000;
      return out(L, b.name, sellBusinessFor(L, b, offer));
    }
    case "close": {
      const left = b.cash - b.debt;
      L.businesses = L.businesses.filter((x) => x.id !== b.id);
      if (left > 0) L.money += left;
      adjust(L, { happiness: -5 });
      m = `🔒 I shut down ${b.name}.${left > 0 ? ` After paying its debts, ${formatMoney(left)} came back to me.` : " Its debts died with it."}`;
      break;
    }
  }
  return out(L, b.name, m);
}
