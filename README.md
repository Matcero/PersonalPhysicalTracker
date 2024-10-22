# LabMob
cd C:\Users\ceron\AndroidStudioProjects\LabMob

npm install -g @angular/cli

npm install -g @ionic/cli

ionic start LabMob blank --type=angular

cd LabMob

# Per far partire l'app web su android
npm install @capacitor/core @capacitor/cli
npm install @capacitor/motion
npm install @capacitor/local-notifications

ionic capacitor add android
ionic serve

ionic build
ionic capacitor sync
ionic capacitor open android
