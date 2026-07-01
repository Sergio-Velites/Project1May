import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
    :root {
        --bg: #f9f2fa;
        --main: black;
        --green: #48a058;
        --orange: #d0a000;
        --red: #d05030;
    }

    /*
     * El juego es una pantalla Game Boy de tamaño fijo: no debe hacer zoom por
     * doble-tap ni por pinch en el navegador (antes molestaba en móvil/trackpad).
     * touch-action: manipulation elimina el doble-tap-zoom (y el delay de 300 ms);
     * user-scalable=no (en index.html) desactiva el pinch. Solo afecta al bundle
     * del juego, NO al Map Editor (que vive en la app Next, otro scope de CSS).
     */
    html, body {
        touch-action: manipulation;
        -webkit-text-size-adjust: 100%;
        text-size-adjust: 100%;
        overscroll-behavior: none;
    }

    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-size: 10px;
        -webkit-tap-highlight-color: transparent;
        color: var(--main);
    }

    button {
        background: none;
        border: none;
        outline: none;
    }
    
    input {
        border: none;
        outline: none;
        background: none;

        // Remove arrows from number input
        &::-webkit-outer-spin-button,
        &::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
    }

    a {
        text-decoration: none;
    }
`;

const GlobalStyles = (): JSX.Element => {
  return <GlobalStyle />;
};

export default GlobalStyles;
