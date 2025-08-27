export interface DatabaseUpdate {
  id: string;
  title: string;
  description: string;
  sql: string;
  filePath: string;
  date: string; // YYYY-MM-DD
}

export const DATABASE_UPDATES: DatabaseUpdate[] = [
  {
    id: '20240728-add-invitations',
    title: 'Add User Invitations Feature',
    description: 'Adds a new JSON column to the "users" table to store invitation data, including sender, recipient, and status. This is necessary for the new feature allowing users to connect with each other in the Virtual Reality section.',
    sql: "ALTER TABLE users ADD COLUMN invitations JSON;",
    filePath: 'types.ts (interface User)',
    date: '2024-07-28'
  }
  // Future updates that require manual SQL execution will be added here by the AI.
];