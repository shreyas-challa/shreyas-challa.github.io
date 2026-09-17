// Roster for the /challenges team game. Edit this list to change who can sign
// in. Matching is case-insensitive, so the casing here is only what gets shown
// back to the player once they are in.
export const CHALLENGE_USERNAMES = [
  'MissionDirector',
  'CapeCom',
  'FlightDirector',
  'ArtemisLead',
  'GuidanceOfficer',
  'RetroOfficer',
  'FIDOControl',
  'EECOMCtrl',
  'PowerSystems',
  'NavSystems',
  'ThermalEng',
  'CommsEng',
  'TelemetryAnlst',
  'OrbitAnalyst',
  'DataAnlst',
  'SensorAnlst',
  'MedOfficer',
  'PayloadSpec',
  'EVASpec',
  'LifeSupport',
]

const BY_LOWERCASE = new Map(
  CHALLENGE_USERNAMES.map((name) => [name.toLowerCase(), name]),
)

// Returns the roster's own spelling of the name, or null if it is not on the
// list. Callers use the returned value so "flightdirector" displays as
// "FlightDirector".
export function resolveUsername(input) {
  if (typeof input !== 'string') return null
  return BY_LOWERCASE.get(input.trim().toLowerCase()) ?? null
}

// True when the name is on the roster, ignoring case and surrounding spaces.
export function isKnownUsername(input) {
  return resolveUsername(input) !== null
}
