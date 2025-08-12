
import RouteMapGoogle, { LatLng, Bathroom } from './RouteMapGoogle.web';


type RouteMapWebProps = {
  start: LatLng;
  end: LatLng;
  bathrooms: Bathroom[];
  navigationStep?: number | null;
  onDirectionsReady?: (steps: Array<{ instruction: string; distance: string; duration: string }>) => void;
};

export default function RouteMapWeb(props: RouteMapWebProps) {
  return <RouteMapGoogle {...props} />;
}
