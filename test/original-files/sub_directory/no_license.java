import java.util.Random;

public class HelloWorld {

    public static void main(String[] args) {
        String helloWorld = "";

        while (!helloWorld.equals("helloworld")) {
            helloWorld = "";

            for(int i = 0; i < 10; i++){
                Random r = new Random();
                int ascii = r.nextInt((122 - 97) + 1) + 97;

                helloWorld = helloWorld + Character.toString((char) ascii);
            }

            System.out.print(helloWorld);
        }
    }

}