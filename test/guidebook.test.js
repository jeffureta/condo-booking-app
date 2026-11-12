import { test, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  GUIDEBOOK_DATA,
  searchGuidebook,
  getGuidebookSection
} from '../guidebook-content.js';

describe('In-Unit Digital Guest Guidebook Domain Logic (TDD)', () => {
  it('GUIDEBOOK_DATA contains accurate property, wifi, and support information', () => {
    assert.ok(GUIDEBOOK_DATA, 'GUIDEBOOK_DATA must be defined');
    assert.strictEqual(GUIDEBOOK_DATA.property.unit, 'Unit 418');
    assert.strictEqual(GUIDEBOOK_DATA.property.building, 'Serin East Tagaytay');
    assert.ok(GUIDEBOOK_DATA.wifi.ssid, 'Wi-Fi SSID must be present');
    assert.ok(GUIDEBOOK_DATA.wifi.password, 'Wi-Fi password must be present');
    assert.strictEqual(GUIDEBOOK_DATA.endorsement.url, 'https://serineasttagaytayendorsement.carrd.co/');
  });

  it('contains comprehensive appliance guides with operating steps and troubleshooting', () => {
    const appliances = GUIDEBOOK_DATA.appliances;
    assert.ok(appliances.length >= 4, 'Should contain at least 4 core appliances');

    const ac = appliances.find(a => a.id === 'ac');
    assert.ok(ac, 'AC guide must exist');
    assert.ok(ac.steps.length > 0, 'AC must have operating steps');
    assert.ok(ac.troubleshooting.length > 0, 'AC must have troubleshooting tips');

    const cooktop = appliances.find(a => a.id === 'induction_cooktop');
    assert.ok(cooktop, 'Induction cooktop guide must exist');
    assert.match(cooktop.troubleshooting.join(' '), /pan|cookware|lock/i);

    const tv = appliances.find(a => a.id === 'smart_tv');
    assert.ok(tv, 'Smart TV guide must exist');
    assert.match(tv.steps.join(' '), /netflix|source/i);

    const heater = appliances.find(a => a.id === 'water_heater');
    assert.ok(heater, 'Water heater guide must exist');
  });

  it('contains parking policies with ₱350/night tower fee and endorsement requirements', () => {
    const parking = GUIDEBOOK_DATA.parking;
    assert.ok(parking, 'Parking policy must exist');
    assert.strictEqual(parking.tower_fee_php, 350);
    assert.match(parking.endorsement_rule, /advance|admin/i);
    assert.ok(parking.street_parking_info, 'Street parking details must exist');
  });

  it('contains building rules for swimming pool, quiet hours, and garbage disposal', () => {
    const rules = GUIDEBOOK_DATA.building_rules;
    assert.ok(rules, 'Building rules must exist');
    assert.ok(rules.pool_info, 'Pool info must exist');
    assert.ok(rules.quiet_hours, 'Quiet hours must exist');
    assert.ok(rules.trash_disposal, 'Trash disposal must exist');
  });

  it('searchGuidebook accurately finds matching sections by query', () => {
    const cooktopResults = searchGuidebook('induction');
    assert.ok(cooktopResults.length > 0);
    assert.strictEqual(cooktopResults[0].id, 'induction_cooktop');

    const parkingResults = searchGuidebook('parking 350');
    assert.ok(parkingResults.length > 0);

    const netflixResults = searchGuidebook('netflix');
    assert.ok(netflixResults.length > 0);

    const emptyResults = searchGuidebook('nonexistentqueryxyz');
    assert.strictEqual(emptyResults.length, 0);
  });

  it('getGuidebookSection retrieves specific section by ID', () => {
    const wifi = getGuidebookSection('wifi');
    assert.ok(wifi);
    assert.strictEqual(wifi.ssid, GUIDEBOOK_DATA.wifi.ssid);

    const unknown = getGuidebookSection('nonexistent_id');
    assert.strictEqual(unknown, null);
  });

  it('Index.html and Scripts.html include tab switching, guidebook cards, and 1-tap copy', () => {
    const indexHtml = fs.readFileSync(path.resolve('Index.html'), 'utf8');
    const scriptsHtml = fs.readFileSync(path.resolve('Scripts.html'), 'utf8');
    const stylesHtml = fs.readFileSync(path.resolve('Styles.html'), 'utf8');

    // Index verification
    assert.ok(indexHtml.includes('id="tabNavGuidebook"'), 'Guidebook tab button must exist');
    assert.ok(indexHtml.includes('id="guidebookTabView"'), 'Guidebook tab container must exist');
    assert.ok(indexHtml.includes('id="guidebookSearchInput"'), 'Guidebook search input must exist');
    assert.ok(indexHtml.includes('copyWifiPassword()'), 'Wi-Fi copy button trigger must exist');

    // Scripts verification
    assert.ok(scriptsHtml.includes('function switchMainTab('), 'switchMainTab controller must exist');
    assert.ok(scriptsHtml.includes('function copyWifiPassword('), 'copyWifiPassword controller must exist');
    assert.ok(scriptsHtml.includes('function handleGuidebookSearch('), 'handleGuidebookSearch controller must exist');
    assert.ok(scriptsHtml.includes('page=guidebook'), 'Deep link handler must exist');

    // Styles verification
    assert.ok(stylesHtml.includes('.app-tab-nav'), 'Tab navigation CSS must exist');
    assert.ok(stylesHtml.includes('.guidebook-container'), 'Guidebook container CSS must exist');
    assert.ok(stylesHtml.includes('.guide-card'), 'Guide card CSS must exist');
  });
});
