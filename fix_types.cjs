const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

const duplicateBlock = `
export interface Task {
  id?: string;
  title: string;
  description?: string;
  assignedTo: string;
  assignedBy: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt: string;
}`;

code = code.replace(duplicateBlock, '');

// Now let's update the original interface Task to include the missing fields
const originalBlock = `export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  dueDate?: string;
  createdAt: string;
  userId?: string;
}`;

const mergedBlock = `export interface Task {
  id?: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt: string;
  userId?: string;
  assignedTo?: string;
  assignedBy?: string;
}`;

code = code.replace(originalBlock, mergedBlock);

fs.writeFileSync('src/types.ts', code);
console.log('Fixed duplicate Task interface in types.ts');
