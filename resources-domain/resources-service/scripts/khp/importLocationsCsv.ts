// eslint-disable-next-line import/no-extraneous-dependencies
import { parse } from 'csv-parse';
import fs from 'fs';
import { pgp } from '../../src/connection-pool';

const CANADIAN_PROVINCE_NAME_CODE_MAP = {
  Alberta: 'AB',
  'British Columbia': 'BC',
  Manitoba: 'MB',
  'New Brunswick': 'NB',
  'Newfoundland and Labrador': 'NL',
  'Northwest Territories': 'NT',
  'Nova Scotia': 'NS',
  Nunavut: 'NU',
  Ontario: 'ON',
  'Prince Edward Island': 'PE',
  Quebec: 'QC',
  Saskatchewan: 'SK',
  Yukon: 'YT',
} as const;

const CANADIAN_PROVINCE_CODE_FR_MAP = {
  AB: 'Alberta',
  BC: 'Colombie-Britannique',
  NL: 'Terre-Neuve-et-Labrador',
  PE: 'Île-du-Prince-Édouard',
  NS: 'Nouvelle-Écosse',
  NB: 'Nouveau-Brunswick',
  ON: 'Ontario',
  MB: 'Manitoba',
  SK: 'Saskatchewan',
  YT: 'Yukon',
  NT: 'Territoires du Nord-Ouest',
  NU: 'Nunavut',
  QC: 'Québec',
} as const;

const TARGET_FILE_PATH = './reference-data/khp_cities_20230612.sql';
const main = async () => {
  if (process.argv.length < 3) {
    console.error('Usage: node importLocationsCsv.js <accountSid>');
    process.exit(1);
  }
  const sqlFile = fs.createWriteStream(TARGET_FILE_PATH);
  const csvLines = fs
    .createReadStream('./reference-data/khp_cities_20230612.csv')
    .pipe(parse({ fromLine: 2 }));
  sqlFile.write(`--- PROVINCES ---\n\n`);

  Object.entries(CANADIAN_PROVINCE_NAME_CODE_MAP).forEach(([name, code]) => {
    sqlFile.write(
      pgp.as.format(
        `
INSERT INTO resources."ResourceReferenceStringAttributeValues" ("accountSid", "list", "id", "value", "language", "info") VALUES ($<accountSid>, 'provinces', $<id>, $<value>, 'en', $<info>);
INSERT INTO resources."ResourceReferenceStringAttributeValues" ("accountSid", "list", "id", "value", "language", "info") VALUES ($<accountSid>, 'provinces', $<idFr>, $<value>, 'fr', $<infoFr>);`,
        {
          accountSid: process.argv[2],
          id: `CA-${code}-en`,
          idFr: `CA-${code}-fr`,
          value: `CA/${code}`,
          info: { name },
          infoFr: { name: CANADIAN_PROVINCE_CODE_FR_MAP[code] },
        },
      ),
    );
  });
  sqlFile.write('\n\n--- CITIES ---\n\n');
  for await (const line of csvLines) {
    const [cityEn, cityFr, , , province] = line;
    const provinceCode = CANADIAN_PROVINCE_NAME_CODE_MAP[province];
    const sqlStatement = pgp.as.format(
      `
INSERT INTO resources."ResourceReferenceStringAttributeValues" ("accountSid", "list", "id", "value", "language", "info") VALUES ($<accountSid>, 'cities', $<id>, $<value>, 'en', $<info>);
INSERT INTO resources."ResourceReferenceStringAttributeValues" ("accountSid", "list", "id", "value", "language", "info") VALUES ($<accountSid>, 'cities', $<idFr>, $<value>, 'fr', $<infoFr>);`,
      {
        accountSid: process.argv[2],
        id: `CA-${provinceCode}-${cityEn}-en`,
        idFr: `CA-${provinceCode}-${cityEn}-fr`,
        value: `CA/${provinceCode}/${cityEn}`,
        info: { name: cityEn },
        infoFr: { name: cityFr },
      },
    );
    sqlFile.write(sqlStatement);
  }
  sqlFile.end();
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});
