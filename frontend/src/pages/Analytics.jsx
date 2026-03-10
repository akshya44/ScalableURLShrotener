import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { getLinkAnalytics, getSummary, getUserUrls } from '../services/api';
import ClickChart from '../charts/ClickChart';
import CountryChart from '../charts/CountryChart';
import DeviceChart from '../charts/DeviceChart';
import BrowserChart from '../charts/BrowserChart';
import { Loader, BarChart2, Globe, Smartphone, ChromeIcon } from 'lucide-react';

const Analytics = () => {
    const [searchParams] = useSearchParams();
    const initialCode = searchParams.get('code') || '';
    const [shortCode, setShortCode] = useState(initialCode);
    const [inputCode, setInputCode] = useState(initialCode);
    const [analytics, setAnalytics] = useState(null);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [userLinks, setUserLinks] = useState([]);
    const [days, setDays] = useState(30);

    // Initial Fetch
    useEffect(() => {
        getSummary().then(r => setSummary(r.data)).catch(() => { });
        getUserUrls(1, 50).then(r => setUserLinks(r.data.urls)).catch(() => { });
    }, []);

    // Analytics Fetch
    useEffect(() => {
        if (!shortCode) return;
        setLoading(true);
        getLinkAnalytics(shortCode, days)
            .then(r => setAnalytics(r.data))
            .catch(() => setAnalytics(null))
            .finally(() => setLoading(false));
    }, [shortCode, days]);

    // Socket.io Real-Time Updates
    useEffect(() => {
        const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');

        socket.on('click_event', (data) => {
            // Update the global dashboard summary if it exists
            setSummary(prev => {
                if (!prev) return prev;
                return { ...prev, totalClicks: prev.totalClicks + 1 };
            });

            // Update specific link analytics if we are currently viewing it
            setAnalytics(prev => {
                if (!prev || data.shortCode !== shortCode) return prev;

                // Deep clone object to force React to re-render charts
                const newAnalytics = JSON.parse(JSON.stringify(prev));
                newAnalytics.total += 1;

                // 1. Update clicksPerDay (assuming today is the last item)
                const today = new Date().toISOString().split('T')[0];
                const lastDayIndex = newAnalytics.clicksPerDay.findIndex(d => d.date === today);
                if (lastDayIndex >= 0) {
                    newAnalytics.clicksPerDay[lastDayIndex].clicks += 1;
                } else {
                    newAnalytics.clicksPerDay.push({ date: today, clicks: 1 });
                }

                // 2. Update topCountries
                const countryIdx = newAnalytics.topCountries.findIndex(c => c.country === data.country);
                if (countryIdx >= 0) {
                    newAnalytics.topCountries[countryIdx].clicks += 1;
                } else if (data.country) {
                    newAnalytics.topCountries.push({ country: data.country, clicks: 1 });
                }

                // 3. Update devices
                const deviceIdx = newAnalytics.devices.findIndex(d => d.device === data.device);
                if (deviceIdx >= 0) {
                    newAnalytics.devices[deviceIdx].clicks += 1;
                } else if (data.device) {
                    newAnalytics.devices.push({ device: data.device, clicks: 1 });
                }

                // 4. Update browsers
                const browserIdx = newAnalytics.browsers.findIndex(b => b.browser === data.browser);
                if (browserIdx >= 0) {
                    newAnalytics.browsers[browserIdx].clicks += 1;
                } else if (data.browser) {
                    newAnalytics.browsers.push({ browser: data.browser, clicks: 1 });
                }

                // Sort purely so Recharts displays highest -> lowest
                newAnalytics.topCountries.sort((a, b) => b.clicks - a.clicks);
                newAnalytics.devices.sort((a, b) => b.clicks - a.clicks);
                newAnalytics.browsers.sort((a, b) => b.clicks - a.clicks);

                return newAnalytics;
            });
        });

        return () => socket.disconnect();
    }, [shortCode]); // Re-bind listener if shortCode changes so closure has fresh ID

    const handleSearch = (e) => {
        e.preventDefault();
        setShortCode(inputCode.trim());
    };

    return (
        <div className="page analytics-page">
            <div className="analytics-header">
                <h1 className="page-title">Analytics <span style={{ fontSize: '0.6em', color: '#10b981', marginLeft: '8px', verticalAlign: 'middle' }}>● Live</span></h1>

                {summary && (
                    <div className="stats-grid">
                        <div className="stat-card">
                            <p className="stat-label">Total Links</p>
                            <p className="stat-value">{summary.totalLinks}</p>
                        </div>
                        <div className="stat-card">
                            <p className="stat-label">Active Links</p>
                            <p className="stat-value stat-green">{summary.activeLinks}</p>
                        </div>
                        <div className="stat-card">
                            <p className="stat-label">Total Clicks</p>
                            <p className="stat-value stat-blue">{summary.totalClicks}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Link selector */}
            <div className="analytics-selector card">
                <form onSubmit={handleSearch} className="selector-row">
                    <select
                        className="form-input"
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value)}
                    >
                        <option value="">-- Select a link --</option>
                        {userLinks.map(l => (
                            <option key={l.short_code} value={l.short_code}>
                                {l.short_code} — {l.original_url.slice(0, 50)}
                            </option>
                        ))}
                    </select>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="or type a short code"
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value)}
                    />
                    <select
                        className="form-input days-select"
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                    >
                        <option value={7}>Last 7 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={90}>Last 90 days</option>
                    </select>
                    <button type="submit" className="btn btn-primary">View Analytics</button>
                </form>
            </div>

            {!shortCode && (
                <div className="empty-state">
                    <BarChart2 size={48} className="empty-icon" />
                    <p>Select a link to view its analytics</p>
                </div>
            )}

            {loading && (
                <div className="loading-state"><Loader size={24} className="spin" /> Loading analytics...</div>
            )}

            {analytics && !loading && (
                <>
                    <div className="analytics-stat-row">
                        <div className="stat-card stat-card-large">
                            <p className="stat-label">Total Clicks</p>
                            <p className="stat-value stat-blue" style={{ fontSize: '2.5rem' }}>{analytics.total}</p>
                        </div>
                    </div>

                    <div className="charts-grid">
                        <div className="chart-card">
                            <h3 className="chart-title"><BarChart2 size={16} /> Clicks Over Time</h3>
                            <ClickChart data={analytics.clicksPerDay} />
                        </div>

                        <div className="chart-card">
                            <h3 className="chart-title"><Globe size={16} /> Top Countries</h3>
                            {analytics.topCountries.length > 0
                                ? <CountryChart data={analytics.topCountries} />
                                : <p className="no-data">No geo data yet</p>}
                        </div>

                        <div className="chart-card">
                            <h3 className="chart-title"><Smartphone size={16} /> Devices</h3>
                            {analytics.devices.length > 0
                                ? <DeviceChart data={analytics.devices} />
                                : <p className="no-data">No device data yet</p>}
                        </div>

                        <div className="chart-card">
                            <h3 className="chart-title">Browsers</h3>
                            {analytics.browsers.length > 0
                                ? <BrowserChart data={analytics.browsers} />
                                : <p className="no-data">No browser data yet</p>}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Analytics;
