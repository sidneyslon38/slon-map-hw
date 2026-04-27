import dayComplaints from '$lib/data/day_complaints.json';
import nightComplaints from '$lib/data/night_complaints.json';

export function load() {
  return {
    showHeader: false,
    showFooter: false,
    dayComplaints,
    nightComplaints,
  };
}