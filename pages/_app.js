import App from '.'
import "bootstrap/dist/css/bootstrap.min.css";
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
config.autoAddCss = false
import '/public/index.css'

export default function MyApp({ Component, pageProps }) {
    return <App {...pageProps} />
}