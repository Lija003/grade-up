import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("ErrorBoundary caught an error", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div style={{
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '300px',
                    textAlign: 'center',
                    background: '#fef2f2',
                    borderRadius: '8px',
                    border: '1px solid #fecaca'
                }}>
                    <div style={{ color: '#ef4444', marginBottom: '1rem' }}>
                        <AlertTriangle size={48} />
                    </div>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#991b1b' }}>Something went wrong.</h3>
                    <p style={{ margin: '0 0 1.5rem 0', color: '#b91c1c', maxWidth: '500px' }}>
                        The application encountered an unexpected error while trying to render this component.
                    </p>

                    <button
                        onClick={() => window.location.reload()}
                        className="btn btn-primary"
                        style={{ background: '#ef4444', borderColor: '#ef4444', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                    >
                        <RefreshCw size={16} /> Reload Page
                    </button>

                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <details style={{ marginTop: '2rem', textAlign: 'left', background: '#fff', padding: '1rem', borderRadius: '4px', width: '100%', overflowX: 'auto' }}>
                            <summary style={{ cursor: 'pointer', color: '#7f1d1d', fontWeight: 'bold' }}>Error Details (Dev Only)</summary>
                            <pre style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '1rem' }}>
                                {this.state.error.toString()}
                                <br />
                                {this.state.errorInfo?.componentStack}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
