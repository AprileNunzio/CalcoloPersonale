import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { translate } from './shared/i18n';
import App from './features/boot/App';
import './features/boot/styles.css';
class ErrorBoundary extends Component<{children:ReactNode},{failed:boolean}> {
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 componentDidCatch(_error:Error,_info:ErrorInfo){document.documentElement.dataset.applicationState='failed';}
 render(){return this.state.failed ? <main role="alert"><h1>Calcolo Personale</h1><p>{translate('it','fatalError')}</p></main> : this.props.children;}
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><ErrorBoundary><App/></ErrorBoundary></React.StrictMode>);
