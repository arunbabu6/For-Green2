pipeline {
    agent any
    triggers {
        pollSCM('H/15 * * * *')
    }

    environment {
        // Defined environment variables
        SONARQUBE_TOKEN = credentials('Sonarcube-cred')
        //SNYK_TOKEN = credentials('snyk-secret-text')
        DOCKERHUB_CREDENTIALS = credentials('Dockerhub')
        // SSH credentials for each environment
        DEMO_SSH_CREDENTIALS = credentials('ssh-wsl') 
        //TEST_SSH_CREDENTIALS = credentials('test-ssh-credentials-id')
        //STAGE_SSH_CREDENTIALS = credentials('stage-ssh-credentials-id')
        //PROD_SSH_CREDENTIALS = credentials('prod-ssh-credentials-id')
        // Docker Hosts setup
        DEMO_DOCKER_HOST = 'ssh://host.docker.internal' 
        TEST_DOCKER_HOST = 'ssh://test-user@test-docker-host'
        STAGE_DOCKER_HOST = 'ssh://stage-user@stage-docker-host'
        PROD_DOCKER_HOST = 'ssh://prod-user@prod-docker-host'
        DOCKER_IMAGE = 'arunthopil/pro-green-v2'

        // Define ENVIRONMENT variable here
        ENVIRONMENT = ''
    }

    stages {
        stage('Setup') {
            steps {
                script {
                    // Dynamic environment setup based on branch name
                    ENVIRONMENT = BRANCH_NAME == 'development' ? 'Demo' :
                                  BRANCH_NAME == 'staging' ? 'Staging' :
                                  BRANCH_NAME == 'production' ? 'Production' :
                                  BRANCH_NAME.startsWith('test') ? 'Testing' : 'Unknown'
                    echo "Environment set to ${ENVIRONMENT}"
                }
            }
        }

        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }
        stage('Clean Workspace') {
            steps {
                deleteDir()
            }
        }
        stage('Use Artifacts') {
            steps {
                script {
                    if (currentBuild.previousBuild != null && currentBuild.previousBuild.result == 'SUCCESS') {
                        copyArtifacts(projectName: "${JOB_NAME}", selector: lastSuccessful(), filter: 'lint-results.txt');
                    } else {
                        echo "No previous successful build found. Skipping artifact copy."
                    }
                }                        
                // Use lint-results.txt as needed
            }
        }
        
        
        stage('Install Dependencies') {
            agent {
                docker { 
                    image 'node:21' // Use Node.js version 21
                   //args '-v /workspace/Project2-Green_main/client:/app' // Mount the client directory to /app in the container
                }
            }
            steps {
                // Change working directory client
                dir('client') {
                    // Ensure a clean state by removing node_modules
                    sh 'rm -rf node_modules/'
                    // Install dependencies as defined in package.json
                    sh 'npm install'
                    // Verify eslint-plugin-react is installed
                    sh 'npm list eslint-plugin-react'
                }
            }
        }

        stage('Build Node.js Application') {
            agent {

                // Ensure consistency by using the same Node.js version
                docker { image 'node:21' } // Match this version with the Install Dependencies stage
            }
            steps {
                dir('client') {
                     sh 'npm run build'
                }
            }
        }

        // SonarQube Analysis and Snyk Security Scan 
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('Sonarcube') { // 'Sonarcube-cred' from |should match the SonarQube configuration in Jenkins
                    sh """
                      sonar-scanner \
                      -Dsonar.projectKey=my-project \
                      -Dsonar.sources=. \
                      -Dsonar.host.url=https://sonarqube.globalgreeninit.world \
                      -Dsonar.login=$SONARQUBE_TOKEN
                    """
                }
            }
        }

        stage('Snyk Security Scan') {
                     steps {
                            snykSecurity failOnError: false, failOnIssues: false, organisation: 'Group2-Global-Green', projectName: 'Fork-group2-global-green-init', snykInstallation: 'Snyk', snykTokenId: 'Snyk', targetFile: 'package.json'
                         }
            }
               // snykSecurity failOnError: false, failOnIssues: false, organisation: 'Group2-Global-Green', projectName: 'Fork-group2-global-green-init', snykInstallation: 'Snyk', snykTokenId: 'Snyk-Token-ID', targetFile: 'Fork-group2-global-green-init/client/package.json'
                //snykSecurity failOnError: false, failOnIssues: false, organisation: 'Group2-Global-Green', snykInstallation: 'Snyk', snykTokenId: 'Snyksecret'
                
            
        
           
        stage('Lint') {
            steps {
                dir('client') { // Ensure we're inside the 'client' directory where package.json is located
                                // Execute the lint script and allow the build to fail on lint errors
                  script {
                     // Run lint script and capture the exit code
                     def lintExitCode = sh(script: 'npm run lint:ci || true', returnStatus: true)

                     // Check if the lint report exists
                      if (fileExists('eslint-report.json')) {
                     // Archive the eslint report
                          archiveArtifacts artifacts: 'eslint-report.json', onlyIfSuccessful: false
                    } else {
                          echo "No eslint-report.json found"
                    }

                // If the lint script exited with an error (non-zero exit code), fail the build
                      if (lintExitCode != 0) {
                           error("Linting failed with exit code: ${lintExitCode}")
                     }
                   }
               }
           }
        }


        //stage('Lint') {
        //    steps {
        //        dir('client') { // Ensure we're inside the 'client' directory where package.json is located
        //            sh 'npm run lint:ci || true' // Run the lint script for CI which generates a JSON report
        //            archiveArtifacts artifacts: 'eslint-report.json', onlyIfSuccessful: false
        //        }
        //    }
       // }
        

        stage('Build and Push Docker Image') {
            steps {
                script {
                    withCredentials([string(credentialsId: 'Dockerhub', variable: 'Dockerhub')]) {
                    sh 'docker login -u arunthopil' -p $Dockerhub
                    }
                    def appImage = docker.build('${DOCKER_IMAGE}:${ENVIRONMENT.toLowerCase()}-${env.BUILD_NUMBER}')
                    appImage.push()
                }
            }
        }
        

        // Build and Push Docker Image stage remains effective for creating a Docker image and pushing it to a registry

        stage('Deploy') {
            steps {
                script {
                    def dockerHost = ''
                    def sshCredentialsId = ''
                    switch (ENVIRONMENT) {
                        case 'Demo':
                            dockerHost = DEMO_DOCKER_HOST
                            sshCredentialsId = DEMO_SSH_CREDENTIALS
                            break
                    //Commented out until these environments for now
                        //case 'Staging':
                            //dockerHost = STAGE_DOCKER_HOST
                            //sshCredentialsId = STAGE_SSH_CREDENTIALS
                           // break
                        //case 'Production':
                          //  dockerHost = PROD_DOCKER_HOST
                          //  sshCredentialsId = PROD_SSH_CREDENTIALS
                          //  break
                        //case 'Testing':
                          //  dockerHost = TEST_DOCKER_HOST
                          //  sshCredentialsId = TEST_SSH_CREDENTIALS
                          //  break
                    }

                    if (dockerHost.startsWith('ssh://')) {
                        sshagent([sshCredentialsId]) {
                            sh """
                                ssh -o StrictHostKeyChecking=no ${dockerHost} <<EOF
                                    docker pull ${DOCKER_IMAGE}:${ENVIRONMENT.toLowerCase()}-${env.BUILD_NUMBER}
                                    docker stop ${ENVIRONMENT.toLowerCase()}-app || true
                                    docker rm ${ENVIRONMENT.toLowerCase()}-app || true
                                    docker run -d --name ${ENVIRONMENT.toLowerCase()}-app -p 80:3000 ${DOCKER_IMAGE}:${ENVIRONMENT.toLowerCase()}-${env.BUILD_NUMBER}
                                EOF
                            """
                        }
                    } else {
                        echo "Local deployment logic not specified"
                    }
                }
            }
        }
    }

    post {
        always {
                archiveArtifacts artifacts: 'eslint-report.json', onlyIfSuccessful: false
                echo "Pipeline execution completed for ${ENVIRONMENT}"
            }
            
        }
 
}
