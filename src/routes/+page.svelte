<script>
  import ArticleHeader from '$lib/components/Article/ArticleHeader.svelte';
  import Map from '$lib/components/Maps/Map.svelte';
  import MapLayer from '$lib/components/Maps/MapLayer.svelte';
  import Geocoder from '$lib/components/Maps/Geocoder.svelte';
  import Dashboard from '$lib/components/Data/Dashboard.svelte';
  import BigNumber from '$lib/components/Data/BigNumber.svelte';
  import MethodoloyBox from '$lib/components/Article/MethodologyBox.svelte';
  import Legend from '$lib/components/Maps/Legend.svelte';

  let { data } = $props();
  const dayComplaints = data.dayComplaints;
  const nightComplaints = data.nightComplaints;

  let longitude = $state(-74.0);
  let latitude = $state(40.7);
  let zoom = $state(8);
  let isNight = $state(false);

  const complaints = $derived(isNight ? nightComplaints : dayComplaints);
  const theme = $derived(isNight ? 'fiord' : 'positron');
  const colorScheme = $derived(
    ['#fffacd', '#ffed4e', '#ffd700', '#ffb347', '#ff8c00', '#ff6347']
  );
</script>

<div class="container">
  <ArticleHeader
    headline="Tracking NYC Noise Complaints: 2025 to Present"
    byline="Sidney Slon"
    pubDate="2026-04-27"
  />

  <p>In data collected from 311 calls between January 1, 2025 and April 27, 2026, noise complaints have been categorized by neighborhood.</p>
  <p>Data is filtered into daytime complaints, between 6AM and 6PM, and nighttime complaints, between 6PM and 6AM.</p>
  <p>Use the toggle switch below to view noise complaints that were called in during the day, or at night.</p>
<p>Overall, there have been <strong>{dayComplaints.features.reduce((sum, d) => sum + d.properties.total_complaints, 0)} daytime</strong> noise complaints, and <strong>{nightComplaints.features.reduce((sum, d) => sum + d.properties.total_complaints, 0)} nighttime</strong> noise complaints since January 1, 2025 in New York City.</p>
<p>Results show that noise complaints are generally much higher at night, between 6PM and 6AM.</p>

<div class="dashboard">
<h3><strong>Top 3 Noisiest Neighborhoods
  {isNight ? ' at Night' : ' During the Day'}:</strong></h3>
  <Dashboard>
    {#each complaints.features
  .toSorted((a, b) => b.properties.total_complaints - a.properties.total_complaints)
  .slice(0, 3) as neighborhood}
  <BigNumber
    label={neighborhood.properties.nta_name}
    number={neighborhood.properties.total_complaints}
  />
{/each}
  </Dashboard>
</div>

  <div class="toggle">
    <label class="switch" aria-label="Toggle night mode">
      <input
        type="checkbox"
        checked={isNight}
        onchange={(e) => (isNight = e.target.checked)}
      />
      <span class="slider"></span>
    </label>
    <span class="toggle-label">{isNight ? 'Night (6PM - 6AM)' : 'Day (6AM - 6PM)'}</span>
  </div>

  <Geocoder
    label="Find your neighborhood"
    placeholder="Enter an address in New York…"
    onresult={(result) => {
      longitude = result.lng;
      latitude = result.lat;
      zoom = 15;
    }}
  />

  <Map
    {longitude}
    {latitude}
    {zoom}
    height={600}
    {theme}
    credit="OpenFreeMap / OpenStreetMap contributors"
    minZoom={6}
    maxZoom={15}
    maxBounds={[[-74.3, 40.45], [-73.68, 40.95]]}
  >
    <MapLayer
      id="nta-fill"
      type="fill"
      data={complaints}
      paint={{
        'fill-color': [
          'step',
          ['get', 'total_complaints'],
          colorScheme[0],
          500,
          colorScheme[1],
          1000,
          colorScheme[2],
          2000,
          colorScheme[3],
          5000,
          colorScheme[4],
          10000,
          colorScheme[5],
        ],
        'fill-opacity': 0.7,
      }}
      popup={(feature) => {
    const p = feature.properties;
    return `
      <div style="font-family: sans-serif; padding: 8px 12px; min-width: 160px;">
        <div style="font-size: 14px; font-weight: 700; margin-bottom: 6px; color: #0033a1;">
          ${p.nta_name}
        </div>
        <div style="font-size: 13px; color: #333;">
          🔊 <strong>${p.total_complaints.toLocaleString()}</strong> noise complaints
        </div>
      </div>
    `;
      }}
    />
    <MapLayer
      id="nta-outline"
      type="line"
      data={complaints}
      paint={{
        'line-color': '#0033a1',
        'line-width': 0.5,
      }}
    />
  </Map>

  <Legend
    title="Noise Complaints"
    mode="threshold"
    items={[
      {
        color: '#fffacd',
        to: 500,
      },
      {
        color: '#ffed4e',
        from: 500,
        to: 1000,
      },
      {
        color: '#ffd700',
        from: 1000,
        to: 2000,
      },
      {
        color: '#ffb347',
        from: 2000,
        to: 5000,
      },
      {
        color: '#ff8c00',
        from: 5000,
      },
    ]}
  />

  <MethodoloyBox>
    <p>Data was sourced from the 311 Service Requests dataset in the Open NYC Data portal. Complaints were filtered by noise-related keywords in the complaint type field, and categorized into daytime and nighttime based on the time of the complaint.</p>
    <p>Neighborhood boundaries were defined using the 2020 NYC Neighborhood Tabulation Areas (NTA) shapefile, which was joined with the complaint data by community district to calculate total complaints per neighborhood. Python and Claude were used for data processing and analysis.</p>
    <p>Map styling was done using MapLibre GL JS, with a custom color scheme to represent complaint density. The dashboard highlights the top 3 noisiest neighborhoods based on total complaints, filtered to day or night mode.</p>
  </MethodoloyBox>
</div>

<style>
  .toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 12px 0;
  }
  .switch {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 24px;
  }
  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #ccc;
    transition: background 0.15s ease, transform 0.15s ease;
    border-radius: 24px;
  }
  .slider:before {
    content: "";
    position: absolute;
    height: 18px;
    width: 18px;
    left: 3px;
    top: 3px;
    background: #fff;
    transition: transform 0.15s ease;
    border-radius: 50%;
  }
  input:checked + .slider {
    background: #ff9933;
  }
  input:checked + .slider:before {
    transform: translateX(20px);
  }
  .toggle-label {
    font-weight: 600;
  }

  .dashboard {
    text-align: center;
    margin-top: 48px;
    gap: 16px;
    margin-bottom: 24px;
  }

  :global(.maplibregl-popup-close-button) {
  font-size: 18px;
  padding: 4px 8px;
  color: #333;
  line-height: 1;
  border-radius: 4px;
}

:global(.maplibregl-popup-close-button:hover) {
  background-color: #f0f0f0;
  color: #0033a1;
}
</style>