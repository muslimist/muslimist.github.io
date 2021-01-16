if('serviceWorker' in navigator){
  navigator.serviceWorker.register('/service-worker.js')
    .then(reg => {
		console.log("service worker registered");

        if(reg.active) {
          reg.addEventListener('updatefound', () => {
            console.log('installing update');
            const installingWorker = reg.installing;
            installingWorker.addEventListener('statechange', () => {
              if(installingWorker.state === 'installed') {
              	reg.waiting.postMessage('skipWaiting');
                console.log('restarting to complete update (just installed)');
                alert('restarting to complete an update');
                location.reload();
              }
            });
          });
          if (reg.waiting) {
          	console.log('restart to complete update (previously installed)');
          	alert('Please close app/tab and reopen to complete update');
    	  }
        }

        


    })
    .catch(err => console.log('service worker not registered', err));
}