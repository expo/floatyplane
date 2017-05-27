import Expo from 'expo';

// We will refer to assets by a 'friendly name' such as 'splash-sound' or
// 'player-sprite', offering an additional level of indirection over the
// actual file paths.

// Map of asset names to modules. List your assets here.
const modules = {
  'player-sprite': require('./floaty.png'),
  'pipe-top': require('./pillar-2.png'),
  'start-screen': require('./splash.png'),
};

// Export map of asset names to `Expo.Asset` objects.
export default Object.assign(
  {},
  ...Object.keys(modules).map(name => ({
    [name]: Expo.Asset.fromModule(modules[name]),
  }))
);
