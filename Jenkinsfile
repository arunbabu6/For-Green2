pipeline {
    agent none

    environment {
        DOCKER_IMAGE = 'arunthopil/pro-green-v2'
        SONARQUBE_TOKEN = credentials('sonar-docker')
        DOCKERHUB_CREDENTIALS = credentials('Dockerhub')
        // SSH credentials for each environment
        DEMO_SSH_CREDENTIALS = credentials('ssh-wsl')
        TEST_SSH_CREDENTIALS = credentials('test-ssh-credentials-id')
        STAGE_SSH_CREDENTIALS = credentials('stage-ssh-credentials-id')
        PROD_SSH_CREDENTIALS = credentials('prod-ssh-credentials-id')
        // Docker Hosts setup
        DEMO_DOCKER_HOST = 'ssh://host.docker.internal'
        TEST_DOCKER_HOST = 'ssh://test-user@test-docker-host'
        STAGE_DOCKER_HOST = 'ssh://stage-user@stage-docker-host'
        PROD_DOCKER_HOST = 'ssh://prod-user@prod-docker-host'
        PROJECT_DIR = '/opt/docker-green'
    }

    stages {
        stage('Setup') {
            agent any
            steps {
                script {
                    env.ENVIRONMENT = BRANCH_NAME == 'main' ? 'Demo' :
                                  BRANCH_NAME == 'production' ? 'Production' :
                                  BRANCH_NAME == 'staging' ? 'Staging' :
                                  BRANCH_NAME.startsWith('test') ? 'Testing' : 'Development'
                    echo "Environment set to ${env.ENVIRONMENT}"
                }
            }
        }

        stage('Checkout Code') {
            agent any
            steps {
                checkout scm
            }
        }

        stage('Clean Workspace') {
            agent any
            steps {
                 script {
                    if (fileExists('.')) {
                        deleteDir()
                    } else {
                        echo "Workspace directory does not exist, no need to delete."
                    }
                 }
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
            }
        }

        stage('Stash Client') {
            agent any
            steps {
                dir('client') {
                    stash includes: '**', name: 'client-src'
                }
            }
        }

        stage('Prepare and Build') {
            agent any
            steps {
                script {
                    unstash 'client-src'
                    dir('client') {
                        // Assuming the build commands are here
                        sh 'npm install'
                        sh 'npm run build'
                        stash includes: '**', name: 'build-artifacts'
                    }
                }
            }
        }

        stage('Analyze and Scan') {
            agent any
            steps {
                script {
                    unstash 'build-artifacts'
                    dir('client') {
                        // Your SonarQube scan
                        withSonarQubeEnv('sonar-docker') {
                            sh "sonar-scanner -Dsonar.projectKey=my-project -Dsonar.sources=. -Dsonar.host.url=https://sonarqube.globalgreeninit.world -Dsonar.login=${env.SONARQUBE_TOKEN}"
                        }
                        snykSecurity failOnError: false, failOnIssues: false, organisation: 'Group2-Global-Green', projectName: 'For-Green2', snykInstallation: 'Snyk', snykTokenId: 'snyk-token', targetFile: '/client/package.json'
                    }
                }
            }
        }

        stage('Build and Push Docker Image') {
            agent any
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'Dockerhub', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                        // Logging into Docker
                        sh "docker login -u ${DOCKER_USERNAME} -p ${DOCKER_PASSWORD}"
                        // Building the Docker image, tag it accordingly
                        sh "docker build -t ${env.DOCKER_IMAGE}:${env.ENVIRONMENT.toLowerCase()}-${env.BUILD_NUMBER} ."
                        // Pushing the Docker image to DockerHub
                        sh "docker push ${env.DOCKER_IMAGE}:${env.ENVIRONMENT.toLowerCase()}-${env.BUILD_NUMBER}"
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    if (env.DEMO_DOCKER_HOST && env.DEMO_SSH_CREDENTIALS) {
                        sshagent([env.DEMO_SSH_CREDENTIALS]) {
                            sh """
                                ssh -o StrictHostKeyChecking=no ${env.DEMO_DOCKER_HOST} <<EOF
                                    docker pull ${env.DOCKER_IMAGE}:${env.ENVIRONMENT.toLowerCase()}-${env.BUILD_NUMBER}
                                    docker stop ${env.ENVIRONMENT.toLowerCase()}-app || true
                                    docker rm ${env.ENVIRONMENT.toLowerCase()}-app || true
                                    docker run -d --name ${env.ENVIRONMENT.toLowerCase()}-app -p 80:3000 ${env.DOCKER_IMAGE}:${env.ENVIRONMENT.toLowerCase()}-${env.BUILD_NUMBER}
                                EOF
                            """
                        }
                    } else {
                        echo "Deployment configuration not found for ${env.ENVIRONMENT}"
                    }
                }
            }
        }
    }

    post {
    always {
        script {
            if (env.ENVIRONMENT) {
                echo "Pipeline execution completed for ${env.ENVIRONMENT}"
            } else {
                echo "Pipeline execution completed, but ENVIRONMENT was not set."
            }
        }
    }
    }
}
