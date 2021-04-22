const
  dirSelector = document.getElementById('dirs'),
  baseDirElem = document.getElementById('selected-basedir');
  baseDirChangeBtn = document.getElementById('change-basedir');
  baseDirConfirmBtn = document.getElementById('confirm-basedir');
  processStatus = document.getElementById('process-status');

dirSelector.addEventListener('click', (evt) => {
  evt.preventDefault()
  window.postMessage({
    type: 'select-dirs',
  })
});

baseDirConfirmBtn.addEventListener('click', (evt) => {
  window.api.send("toMain", {
    directoryConfirmed: true
  });
  baseDirElem.innerHTML = '';
  dirSelector.style.display = 'none';
  document.getElementById('no-directory-selected').style.display = 'none';
  baseDirChangeBtn.style.display = 'block';
  baseDirConfirmBtn.style.display = 'block';
});

window.api.receive('fromMain', (data) => {
  if (data.basePath) {
    baseDirElem.innerHTML = data.basePath;
    dirSelector.style.display = 'none';
    document.getElementById('no-directory-selected').style.display = 'none';
    baseDirChangeBtn.style.display = 'block';
    baseDirConfirmBtn.style.display = 'block';
  }
  else if (data.convertStatus) {
    processStatus.innerHTML = data.convertStatus;
    if (Number.isInteger(data.done)) {
      dirSelector.style.display = 'inline-block';
      baseDirElem.innerHTML = '';
      baseDirChangeBtn.style.display = 'none';
      baseDirConfirmBtn.style.display = 'none';
      document.getElementById('no-directory-selected').style.display = 'block';
    }
  }
});

baseDirChangeBtn.addEventListener('click', function(){
  dirSelector.style.display = 'inline-block';
  baseDirElem.innerHTML = '';
  baseDirChangeBtn.style.display = 'none';
  baseDirConfirmBtn.style.display = 'none';
  document.getElementById('no-directory-selected').style.display = 'block';
});
