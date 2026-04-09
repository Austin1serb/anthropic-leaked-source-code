/**
 * Wine data quality validation.
 * Rejects any wine or producer with missing required fields.
 */

const VALID_TYPES = ["red", "white", "rosé", "sparkling", "dessert", "fortified", "orange"];
const VALID_PRICE_RANGES = ["budget", "mid", "premium", "luxury"];

export function validateProducer(p, index) {
  const errors = [];
  if (!p.id || typeof p.id !== "string") errors.push("missing/invalid id");
  if (!p.name || typeof p.name !== "string") errors.push("missing name");
  if (!p.country || typeof p.country !== "string") errors.push("missing country");
  if (!p.description || typeof p.description !== "string") errors.push("missing description");
  if (p.name === "Unknown" || p.country === "Unknown") errors.push("contains 'Unknown' placeholder");

  if (errors.length > 0) {
    console.error(`  [REJECT] Producer #${index} "${p.name || p.id}": ${errors.join(", ")}`);
    return false;
  }
  return true;
}

export function validateWine(w, index, producerIds) {
  const errors = [];
  if (!w.id || typeof w.id !== "string") errors.push("missing/invalid id");
  if (!w.name || typeof w.name !== "string") errors.push("missing name");
  if (!w.producer || typeof w.producer !== "string") errors.push("missing producer name");
  if (!w.producerId || typeof w.producerId !== "string") errors.push("missing producerId");
  if (w.producerId && !producerIds.has(w.producerId)) errors.push(`producerId "${w.producerId}" not found in producers`);
  if (!Array.isArray(w.grapes) || w.grapes.length === 0) errors.push("missing/empty grapes array");
  if (!w.region || typeof w.region !== "string") errors.push("missing region");
  if (!w.country || typeof w.country !== "string") errors.push("missing country");
  if (!w.type || !VALID_TYPES.includes(w.type)) errors.push(`invalid type "${w.type}"`);
  if (!w.description) errors.push("missing description");
  if (!w.priceRange || !VALID_PRICE_RANGES.includes(w.priceRange)) errors.push(`invalid priceRange "${w.priceRange}"`);
  if (!w.tastingNotes) errors.push("missing tastingNotes");
  if (!w.foodPairing) errors.push("missing foodPairing");

  // Check for garbage data patterns
  if (w.name === "Unknown" || w.producer === "Unknown") errors.push("contains 'Unknown' placeholder");
  if (/^\d{4}$/.test(w.name)) errors.push("name is just a year");
  if (/^\d+[A-Z]{2}\s/.test(w.name)) errors.push("name starts with volume (e.g. '75CL')");
  if (/vinegar|juice|must|brandy|grappa|spirit|liqueur|beer|cider|sake/i.test(w.name)) errors.push("not a wine");

  if (errors.length > 0) {
    console.error(`  [REJECT] Wine #${index} "${w.name || w.id}": ${errors.join(", ")}`);
    return false;
  }
  return true;
}

export function validateDataset(producers, wines, regionLabel) {
  console.log(`\nValidating ${regionLabel}...`);
  const producerIds = new Set(producers.map((p) => p.id));

  let validProducers = 0;
  let validWines = 0;
  const cleanProducers = [];
  const cleanWines = [];

  for (let i = 0; i < producers.length; i++) {
    if (validateProducer(producers[i], i)) {
      cleanProducers.push(producers[i]);
      validProducers++;
    }
  }

  for (let i = 0; i < wines.length; i++) {
    if (validateWine(wines[i], i, producerIds)) {
      cleanWines.push(wines[i]);
      validWines++;
    }
  }

  console.log(`  Producers: ${validProducers}/${producers.length} passed`);
  console.log(`  Wines: ${validWines}/${wines.length} passed`);

  if (validProducers < producers.length || validWines < wines.length) {
    const rejected = (producers.length - validProducers) + (wines.length - validWines);
    console.warn(`  ⚠ ${rejected} records rejected for quality issues`);
  }

  return { producers: cleanProducers, wines: cleanWines };
}
