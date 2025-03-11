import { useState, useEffect } from "react";

let isScriptLoading = false;
let isScriptLoaded = false;

declare global {
  interface Window {
    google?: {
      maps?: {
        places?: object;
      };
    };
    googleMapsScriptCallback?: () => void;
  }
}

export function useGoogleMapsScript(apiKey: string) {
  const [scriptStatus, setScriptStatus] = useState({
    loading: isScriptLoading,
    loaded: isScriptLoaded,
  });

  useEffect(() => {
    if (isScriptLoaded) {
      setScriptStatus({ loading: false, loaded: true });
      return;
    }

    if (isScriptLoading) {
      const checkIfLoaded = () => {
        if (window.google && window.google.maps && window.google.maps.places) {
          isScriptLoaded = true;
          isScriptLoading = false;
          setScriptStatus({ loading: false, loaded: true });
        } else {
          setTimeout(checkIfLoaded, 100);
        }
      };

      checkIfLoaded();
      return;
    }

    if (!apiKey) {
      return;
    }

    isScriptLoading = true;
    setScriptStatus({ loading: true, loaded: false });

    const existingScript = document.getElementById("google-maps-script");
    if (existingScript) {
      document.body.removeChild(existingScript);
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";

    const scriptUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=beta&channel=beta&callback=googleMapsScriptCallback&loading=async`;
    script.src = scriptUrl;

    window.googleMapsScriptCallback = () => {
      if (window.google && window.google.maps) {
        isScriptLoaded = true;
        isScriptLoading = false;
        setScriptStatus({ loading: false, loaded: true });
      }
    };

    script.async = true;
    script.defer = true;

    script.onerror = () => {
      isScriptLoading = false;
      setScriptStatus({ loading: false, loaded: false });
    };

    document.body.appendChild(script);

    const checkScriptLoaded = () => {
      try {
        if (window.google && window.google.maps && window.google.maps.places) {
          isScriptLoaded = true;
          isScriptLoading = false;
          setScriptStatus({ loading: false, loaded: true });
        } else if (window.google && window.google.maps) {
          isScriptLoading = false;
          setScriptStatus({ loading: false, loaded: false });
        } else if (isScriptLoading) {
          setTimeout(checkScriptLoaded, 500);
        }
      } catch {
        isScriptLoading = false;
        setScriptStatus({ loading: false, loaded: false });
      }
    };

    setTimeout(checkScriptLoaded, 2000);

    return () => {};
  }, [apiKey]);

  return scriptStatus;
}
