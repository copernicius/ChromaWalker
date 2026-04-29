import { createBrowserRouter } from 'react-router';
import { Root } from './Root';
import {
  ColorGallery,
  Galleries,
  Home,
  MapExplore,
  Missions,
  Profile,
  Upload,
  Welcome,
} from './pages';

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
