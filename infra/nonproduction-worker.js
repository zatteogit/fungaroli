import application from '../worker/index.js';
import { createEnvironmentBoundary } from './environment-boundary.js';
export default createEnvironmentBoundary(application);
