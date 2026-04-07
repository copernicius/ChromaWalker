import { createBrowserRouter } from 'react-router';
import { Root } from './Root';
import { ColorGallery } from './pages/ColorGallery';
import { Galleries } from './pages/Galleries';
import { Home } from './pages/Home';
import { MapExplore } from './pages/MapExplore';
import { Missions } from './pages/Missions';
import { Profile } from './pages/Profile';
import { Upload } from './pages/Upload';
import { Welcome } from './pages/Welcome';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Welcome },
      { path: 'home', Component: Home },
      { path: 'galleries', Component: Galleries },
      { path: 'gallery/:colorId', Component: ColorGallery },
      { path: 'map', Component: MapExplore },
      { path: 'missions', Component: Missions },
      { path: 'profile', Component: Profile },
      { path: 'upload', Component: Upload },
    ],
  },
]);
