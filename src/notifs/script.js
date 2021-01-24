(async () => {

  if (!('serviceWorker' in navigator)) {
      return alert('You need a browser that supports service workers for this demo to work.');
  }  
  if (!('showTrigger' in Notification.prototype)) {
    return alert('You need a browser with Notification Triggers support for this demo to work.');
  }

  const form1 = document.querySelectorAll('form')[0];
  const seconds = document.querySelector('input[type="text"]');
  const list = document.querySelector('tbody');

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js');
  });


  form1.addEventListener('submit', async (e) => {
    e.preventDefault();


    let {state} = await navigator.permissions.query({name: 'notifications'});
    if (state === 'prompt') {
      await Notification.requestPermission();
    } 

    state = (await navigator.permissions.query({name: 'notifications'})).state;
    if (state !== 'granted') {
      return alert('You need to grant notifications permission for this demo to work.');
    }  


    const sec = parseInt(seconds.value, 10);
    const registration = await navigator.serviceWorker.getRegistration();

    registration.showNotification("title", {
      tag: Math.random().toString().substr(2),
      body: "body",
      requireInteraction: true,
      showTrigger: new TimestampTrigger(Date.now() + sec * 1000),
      vibrate: [200, 100, 200, 100, 200, 100, 200],
      actions: [
        { action: "stopathan", title: "stopathan"},
        { action: "cancel", title: "cancel"}],
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAQAAABLCVATAAAB/ElEQVR4AdSVg44YQBRFz9reDWrFtW3btq2gthvURpz+RO02qL0OapuLl6lGKZZnosm9GT5QKogjAB8BxPEHVCODdfjYyD2q4YdWvCSHHIbiYozoL2mFh2l8Ubb2uOjEW/F8YQxWgjhIjowMOXggTVnDaVL5wBtSOcFqmhAI1OSBcu4gCI1YjivxDAlAP1Jlpo879AHKckfNjxPLbxxVwkGCSZBF3eMYccRxSs1O8Bs1eccXZgMVSFOWJ+xlMDWIJo4aDGEPj5Vym4qEcIgcPtMEje7ywClki/UrW4hBJ4YtfBU9Wx5gOXOxEsJFsT2nLS7a8lw8pwnByUKxfKYhgrBcnlQhNFKnmo+DBBUhi8G7ECxS0ZaIlVUqikL8C8kTpIt3FVZuiTgC/AsJw8V7EwuVRfpIxB8tFMlH8VfFoIcIR8G1kMYR8ffAYJII+/94of3in+T6+vV/vNB68S/6uxN9ZjMxf3qino43SmIP38jhERMIMN6oJwZV7b8m1OWCqJdpBEKE+9fghoojGwGM46nos3+Joxv+yA5yptBOXlMJCCLTF9mJvNFyzeb5mWtvScCOMnylIT4aqOxfiJMQLhRIPdIqZCw6sVqF9FKRVK1mx/2o2U+UkkpF/KgHPYm/iyTyx/R39LW79OMvCaQJa8jdYaSathVc0448AACB4jnRzrdDDgAAAABJRU5ErkJggg=='
    });


    

  });

})();
