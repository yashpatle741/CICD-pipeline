pipeline{
    agent any

       
stages{
   

    stage('build image'){

        steps{

          sh 'docker build -t cicd-pipeline .'
        }
    }

    stage('stop old container'){

        steps{
            sh 'docker stop cicd-container || true'
            sh 'docker rm cicd-container || true' 
        }
    }

    stage('run container'){

       steps{
        sh  'docker run -d -p 3000:3000 --name cicd-container cicd-pipeline'
       }
    }
 }
}

