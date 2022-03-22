package main

import "C"

import (
	"context"
	"log"

	"github.com/hashicorp/terraform-exec/tfexec"
)

// export TerraformApply
func TerraformApply(workDir string, execPath string) {
	tf, err := tfexec.NewTerraform(workDir, execPath)
	if err != nil {
		log.Fatalf("error running NewTerraform: %s", err)
	}

	err = tf.Init(context.Background(), tfexec.Upgrade(true))
	if err != nil {
		log.Fatalf("error running Init: %s", err)
	}

	// opts := tfexec.ApplyOption(dirOrPlan: workDir)
	err = tf.Apply(context.Background())

	if err != nil {
		log.Fatalf("error running Apply: %s", err)
	}
}

func main() {}
