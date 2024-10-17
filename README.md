# LabMob
cd C:\Users\ceron\AndroidStudioProjects\LabMob\LabMob

npm install -g @angular/cli

npm install -g @ionic/cli

ionic start LabMob blank --type=angular

cd LabMob
ionic serve


# Per far partire l'app web su android
npm install @capacitor/core @capacitor/cli

ionic capacitor add android

ionic build

ionic capacitor sync

ionic capacitor open android